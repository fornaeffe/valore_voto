import './App.css'
import CssBaseline from '@mui/material/CssBaseline';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { useState } from 'react';
import RigaPreferenza from './RigaPreferenza';
import RigaOutput from './RigaOutput';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';

import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';

type Stato = {
  partiti : string[],
  preferenze : number[],
  matrice : number[][]
} | undefined

const matriceVuota : Stato = undefined

function App() {

  const [stato, setStato] = useState(matriceVuota)

  let arrayPreferenze : JSX.Element[] = []
  let output : {
    partito: string,
    valore: number
  }[]
  let arrayOutput : JSX.Element[] = []

  function aggiornaPreferenze(i: number, value: number | null) {
    if (stato && value != null) {
      setStato(prevState => {
        if (!prevState) return prevState;

        return {
          ...prevState,
          preferenze: prevState.preferenze.map((prevValue, j) => (j === i ? value - 3 : prevValue))
        }
      })
    }
  }

  if (stato == undefined) {
    fetch("matrice.json")
    .then(response => response.json())
    .then(json => 
      setStato(json)
    )
  } else {
    console.log(stato)
    arrayPreferenze = stato.partiti.map((partito, i) => <RigaPreferenza key={partito} nome={partito} i={i} onChange={(_e, value) => aggiornaPreferenze(i, value) } />)

    output = stato.partiti.map((partito, i) => ({
      partito: partito,
      valore: stato.preferenze.reduce((a, pref, j) => a + pref * stato.matrice[i][j], 0)
    }))

    output.sort((a, b) => b.valore - a.valore)

    arrayOutput = output.map((out, i) => {
      return <RigaOutput output={out} i={i} key={out.partito} />
    })
  }



  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h4">Chi mi conviene votare?</Typography>
            <Typography variant="subtitle1">
              Un calcolatore del "voto utile": 
              indica da chi ti sentiresti rappresentato,
              e scopri come il tuo voto può aiutare (o ostacolare)
              l'elezione dei candidati delle liste
              che ti rappresentano.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Quanto ti rappresentano questi partiti?</Typography>
                <List>
                  {arrayPreferenze}
                </List>
              </CardContent>
            </Card>
            
          </Grid>
          <Grid item xs={12} md={6}>
            
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Voto più efficace:</Typography>
                <List>
                  {arrayOutput}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Cos'è questa cosa?</Typography>
                <Typography gutterBottom>
                  Questa pagina cerca di rispondere alla domanda: 
                  "Se alle prossime Europee voto il partito XY, verranno elette persone che mi rappresentano?".
                </Typography>
                <Typography gutterBottom>
                  In altre parole, cerca di capire qual è il "voto utile".
                </Typography>
                <Typography gutterBottom>
                  In base alle preferenze espresse, il punteggio indica quanto aumenta (o diminuisce) la probabilità che vengano elette persone che
                  ti rappresentano, votando un certo partito.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Come viene calcolato il punteggio?</Typography>
                <Typography gutterBottom>
                  Facciamo un esempio: immaginiamo di voler calcolare il punteggio di Alleanza Verdi e Sinistra
                </Typography>
                <Typography gutterBottom>
                  Basandomi sui sondaggi elettorali più recenti, ho simulato un milione di possibili risultati elettorali,
                  calcolando i seggi ottenuti da ciascun partito.
                </Typography>
                <Typography gutterBottom>
                  Per ciascuno dei possibili risultati, ho provato ad aggiungere 1000 voti ad Alleanza Verdi e Sinistra,
                  controllando se quei voti in più spostassero uno o più seggi da un partito ad un altro.
                </Typography>
                <Typography gutterBottom>
                  Ho quindi fatto la media, tra tutti i possibili risultati, di quanti seggi venivano guadagnati o persi da ciascun partito
                  aggiungendo 1000 voti ad Alleanza Verdi e Sinistra. Ho poi moltiplicato questa media per 1000: il numero ottenuto indica
                  quanti milionesimi di seggio vengono aggiunti o tolti, in media, a ciascun partito, per ogni voto dato ad Alleanza Verdi e Sinistra.                                    
                </Typography>
                <Typography gutterBottom>
                  A questo punto moltiplico ciascuno di questi numeri per la preferenza che hai assegnato: <br />
                  -2 per <SentimentVeryDissatisfiedIcon color="error" /><br />
                  -1 per <SentimentDissatisfiedIcon color="error" /><br />
                  0 per <SentimentSatisfiedIcon color="warning" /><br />
                  +1 per <SentimentSatisfiedAltIcon color="success" /><br />
                  +2 per <SentimentVerySatisfiedIcon color="success" /><br />                                   
                </Typography>
                <Typography gutterBottom>
                  Ad esempio, se un voto ad Alleanza Verdi e Sinistra in media aggiunge tre milionesimi di seggio ad Alleanza Verdi e Sinistra
                  ma nello stesso tempo ne toglie un milionesimo al Partito Democratico, 
                  e tu hai segnato 
                  <SentimentSatisfiedAltIcon color="success" /> per Alleanza Verdi e Sinistra
                  e <SentimentVerySatisfiedIcon color="success" /> per il Partito Democratico,
                  il punteggio sarà di ( 3 milionesimi x 1 ) + ( - 1 milionesimo x 2) = 1
                </Typography>
                <Typography gutterBottom>
                  Questo viene ripetuto per ciascun partito:
                  votare il partito con il punteggio più alto sarà quindi la scelta che,
                  in media, aumenterà di più il numero di persone che ti rappresentano nel Parlamento Europeo.
                </Typography>
                
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography gutterBottom>
                  Dettagli sul <a href="https://github.com/fornaeffe/valore_voto">repository di github</a>
                </Typography>
                
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography gutterBottom>
                  In questa pagina non vengono raccolti dati né viene fatto uso di cookie.
                </Typography>
                <Typography gutterBottom>
                  Creato da Luca Fornasari. Disclaimer: per trasparenza, avviso che sono iscritto al partito Europa Verde.
                </Typography>
                
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        
        
      </Container>
      
    </>
  )
}

export default App
