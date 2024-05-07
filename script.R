library(readxl)

# Dati

seggi <- 76
elettori <- 46000000

liste_sondaggi <- read_xlsx("dati.xlsx")
liste <- read_xlsx("dati.xlsx", "preferenze")

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

liste <- merge(
  liste,
  aggregate(
    Percentuale ~ Partito,
    liste_sondaggi,
    function(x) mean(log(x))
  ),
  all.y = TRUE
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
astensione <- liste[liste$Partito == "astensione", 3:4]
liste <- liste[liste$Partito != "astensione",]

# summary(lm(Percentuale_sd ~ Percentuale, data = liste))

# Supplisco dove manca la dev. st. o la preferenza
liste$Percentuale_sd[is.na(liste$Percentuale_sd)] <- 
  mean(liste$Percentuale_sd, na.rm = TRUE)

liste$preferenza[is.na(liste$preferenza)] <- 0

simulazione <- function(partito, liste) {
  # Simulo l'astensione
  votanti <- floor(
    elettori *
      (1 - exp(rnorm(1, astensione$Percentuale, astensione$Percentuale_sd)))
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
  
  liste$seggio_da_resti <- 
    order(
      liste$resti, 
      liste$voti, 
      runif(liste$voti), 
      decreasing = TRUE
    ) <= seggi_mancanti
  
  liste$seggi <- liste$seggi_interi + liste$seggio_da_resti
  
  return(
    c(
      liste$voti[liste$Partito == partito],
      sum(liste$seggi * liste$preferenza)
    )
    
  )

}

# simulazione(liste)

num.sim <- 100000

risultati <- replicate(num.sim, simulazione("Pace Terra e Dignità", liste))
lo <- loess(risultati[2,] ~ risultati[1,])

plot(risultati[2,] ~ risultati[1,])
x <- seq(min(risultati[1,]), max(risultati[1,]), by = 10000)
lines(predict(lo, x) ~ x, col="red", lwd=2)

y <- predict(lo, x)
differenze <- diff(y)
istogramma <- hist(risultati[1,], breaks = c(x, max(risultati[1,])), plot = FALSE)

sum(c(differenze, 0) * istogramma$counts) / num.sim / 10000 * 1000000
# PD: 0.2850528
# AVS: 6.621788
# M5S: 0.64

# xs <- cut(risultati[1,], x)
# y0 <- tapply(risultati[2,], xs, mean)
# lines(c(y0, NA) ~ x, col = "blue", lwd=2)
