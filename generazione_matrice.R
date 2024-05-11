library(readxl)
library(parallel)

# Parametri

# Numero di simulazioni
nsims <- 1000000
# Larghezza intervallo (in voti) per il calcolo dell'effetto del voto
intervallo <- 1000

# Dati

seggi <- 76
elettori <- 46000000 # TODO: aggiornare il valore

liste_sondaggi <- read_xlsx("dati.xlsx")

# Calcolo la percentuale delle altre liste

altre_liste <- aggregate(
  Percentuale ~ Sondaggio,
  liste_sondaggi[liste_sondaggi$Partito != "astensione",],
  sum
)

altre_liste$Percentuale <- 1 - altre_liste$Percentuale
altre_liste$Partito <- "altre liste"

liste_sondaggi <- rbind(liste_sondaggi, altre_liste)

# Calcolo medie e dev. st. delle log percentuali

liste <- aggregate(
  Percentuale ~ Partito,
  liste_sondaggi,
  function(x) mean(log(x))
)

liste <- merge(
  liste,
  aggregate(
    Percentuale ~ Partito,
    liste_sondaggi,
    function(x) sd(log(x))
  ),
  by = "Partito",
  suffixes = c("", "_sd")
)


# Separo l'astensione
astensione <- liste[liste$Partito == "astensione", 2:3]
liste <- liste[liste$Partito != "astensione",]


# Supplisco dove manca la dev. st. o la preferenza
liste$Percentuale_sd[is.na(liste$Percentuale_sd)] <- 
  mean(liste$Percentuale_sd, na.rm = TRUE)


simulazione <- function(simulaizone, liste, intervallo, elettori, astensione, seggi) {
  # Simulo l'astensione
  votanti <- floor(
    elettori *
      (1 - exp(rnorm(1, astensione$Percentuale, 0*astensione$Percentuale_sd)))
  )
  
  # Simulo la distribuzione dei voti
  log_p <- rnorm(liste$Partito, liste$Percentuale, liste$Percentuale_sd)
  p <- exp(log_p) / sum(exp(log_p))
  
  # Cifra elettorale nazionale
  liste$voti <- floor(p * votanti)
  
  scrutinio <- function(liste) {
    # Percentuali nazionali sui voti validi
    liste$p <- liste$voti / sum(liste$voti)
    
    # Sbarramento
    liste$soglia <- liste$p >= 0.04 & liste$Partito != "altre liste"
    
    # Quoziente elettorale nazionale
    qn <- floor(sum(liste$voti[liste$soglia]) / seggi)
    
    # Seggi interi
    liste$seggi_interi <- floor(liste$voti / qn) * liste$soglia
    
    # Distribuzione dei seggi mancanti alle liste
    # con i maggiori resti
    seggi_mancanti <- seggi - sum(liste$seggi_interi)
    
    liste$resti <- liste$voti %% qn * liste$soglia
    
    liste$seggio_da_resti <- 0
    liste$seggio_da_resti[
      order(
        liste$resti, 
        liste$voti, 
        runif(liste$voti), 
        decreasing = TRUE
      )[seq_len(seggi_mancanti)]
    ] <- 1
    
    
    liste$seggi <- liste$seggi_interi + liste$seggio_da_resti
    
    return(liste$seggi)
  }
  
  
  # Funzione che calcola quanto cambiano i seggi
  # aggiungendo un certo numero di voti
  # alla lista i
  calcola_effetto <- function(i, liste, intervallo) {
    liste2 <- liste
    liste2$voti[i] <- liste2$voti[i] + intervallo
    
    return(scrutinio(liste2) - scrutinio(liste))
  }
  
  # Aggiungo voti a ciascouna lista e
  # guardo come cambiano i voti alle altre liste
  return(sapply(
    seq_len(nrow(liste)), 
    calcola_effetto, 
    liste = liste, 
    intervallo = intervallo
  ))
}

# Svolgo le simulazioni (in parallelo per velocizzare il calcolo)
cl <- makeCluster(parallel::detectCores())

risultato <- parSapply(
  cl, 
  1:nsims, 
  simulazione, 
  liste = liste,
  intervallo = intervallo,
  elettori = elettori,
  astensione = astensione,
  seggi = seggi,
  simplify = "array"
)

stopCluster(cl)

# Faccio la media degli effetti tra tutte le simulazioni,
# esprimendola come milionesimi di seggio
matrice <- apply(risultato, c(1,2), mean) / intervallo * 1000000
dimnames(matrice) <- list(effetto_su = liste$Partito, voto_a = liste$Partito)

# Sposto "altre liste" in fondo
ordine <- order(
  rownames(matrice) == "altre liste",
  rownames(matrice)
)
matrice <- matrice[ordine, ordine]

matrice

# Salvo la matrice
write.csv(matrice, "matrice.csv")

# Togliere il commento alla prossima riga e iniziare
# da qui se non si vuole rifare il processo di generazione della
# matrice, ma solo modificarla
# matrice <- read.csv("matrice.csv", row.names = 1)

# Preparo il file JSON
library(RJSONIO)

matricePerJSON <- matrice
colnames(matricePerJSON) <- NULL

perJSON <- list(partiti = rownames(matrice), preferenze = rep(0, nrow(matrice)), matrice = matricePerJSON)

json <- toJSON(perJSON)

write(json, "public/matrice.json")
