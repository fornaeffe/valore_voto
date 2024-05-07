library(readxl)
library(parallel)

# Parametri

# Numero di simulazioni
nsims <- 10000
# Larghezza intervallo (in voti) per il calcolo dell'effetto del voto
intervallo <- 10000

# Dati

seggi <- 76
elettori <- 46000000

liste_sondaggi <- read_xlsx("dati.xlsx")

# Calcolo la percentuale delle altre liste

altre_liste <- aggregate(
  Percentuale ~ Sondaggio,
  liste_sondaggi[liste_sondaggi$Partito != "astensione",],
  sum
)

altre_liste$Percentuale <- 1 - altre_liste$Percentuale
altre_liste$Partito <- "altre_liste"

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


simulazione <- function(liste) {
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
  
  # Percentuali nazionali sui voti validi
  liste$p <- liste$voti / sum(liste$voti)
  
  # Sbarramento
  liste$soglia <- liste$p >= 0.04 & liste$Partito != "altre_liste"
  
  # Quoziente elettorale nazionale
  qn <- floor(sum(liste$voti[liste$soglia]) / seggi)
  
  liste$seggi_interi <- floor(liste$voti / qn) * liste$soglia
  
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
  
  return(liste[,c("voti", "seggi")])
  
}


risultato <- replicate(nsims, simulazione(liste))

voti <- array(unlist(risultato[1,]), dim = c(nrow(liste), nsims), dimnames = list(Partito = liste$Partito))
seggi <- array(unlist(risultato[2,]), dim = c(nrow(liste), nsims), dimnames = list(Partito = liste$Partito))

calcola_effetto_voto <- function(i, voti, seggi, intervallo, nsims, liste) {
  x <- seq(min(voti[i, ]), max(voti[i, ]), by = intervallo)
  istogramma <- hist(voti[i, ], breaks = c(x, max(voti[i, ])), plot = FALSE)
  
  effetti <- vapply(1:nrow(liste), function(j) {
    lo <- loess(
      seggi[j, ] ~ voti[i, ],
      control = loess.control(statistics = "none")
    )
    
    png(paste0("grafici/", i, "_", j, ".png"))
    plot(
      seggi[j, ] ~ voti[i, ],
      main = paste("Voto a",liste$Partito[i]),
      sub = paste("Effetto su", liste$Partito[j])
    )
    lines(predict(lo, x) ~ x, col = "red", lwd = 2)
    dev.off()
    
    y <- predict(lo, x)
    differenze <- diff(y)
    return(sum(c(differenze, 0) * istogramma$counts) / nsims / intervallo * 1000000)
  }, 1.0)
  
  return(effetti)
}

cl <- makeCluster(parallel::detectCores())

matrice <- parSapply(
  cl, 
  1:nrow(liste), 
  calcola_effetto_voto, 
  voti = voti, 
  seggi = seggi,
  intervallo = intervallo,
  nsims = nsims,
  liste = liste
)

stopCluster(cl)

# matrice <- vapply(1:nrow(liste), calcola_effetto_voto, rep(1.0, nrow(liste)))
dimnames(matrice) <- list(effetto_su = liste$Partito, voto_a = liste$Partito)

matrice

write.csv(matrice, "matrice.csv")
