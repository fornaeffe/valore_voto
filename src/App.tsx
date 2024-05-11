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
import List from '@mui/material/List';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import RigaEffetto from './RigaEffetto';

// TODO: spostare in fondo altre liste e togliere l'underscore

type Stato = {
  partitoSelezionato : number,
  partiti : string[],
  preferenze : number[],
  matrice : number[][]
} | undefined


function App() {

  const [stato, setStato] = useState(undefined as Stato)

  let arrayPreferenze : JSX.Element[] = []
  let output : {
    partito: string,
    valore: number
  }[]
  let arrayOutput : JSX.Element[] = []
  let arrayEffetti : JSX.Element[] = []
  let minmax = [-1, 1]

  function calcolaMinMax(matrice : number[][]) {
    const arr = matrice.reduce(function (p, c) {
      return p.concat(c)
    })

    return([
      Math.min(...arr),
      Math.max(...arr)
    ])
  }

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

  function aggiornaPartitoSelezionato(event: SelectChangeEvent) {
    setStato(prevState => {
      if (!prevState) return prevState;

      return{
        ...prevState,
        partitoSelezionato: parseInt(event.target.value) 
      }
    })
  }

  if (stato == undefined) {
    fetch("matrice.json")
    .then(response => response.json())
    .then(json => 
      setStato({partitoSelezionato: 0, ...json})
    )
  } else {
    arrayPreferenze = stato.partiti.map((partito, i) => <RigaPreferenza key={partito} nome={partito} i={i} onChange={(_e, value) => aggiornaPreferenze(i, value) } />)

    output = stato.partiti.map((partito, i) => ({
      partito: partito,
      valore: stato.preferenze.reduce((a, pref, j) => a + pref * stato.matrice[i][j], 0)
    }))

    output.sort((a, b) => b.valore - a.valore)

    arrayOutput = output.map((out, i) => {
      return <RigaOutput output={out} i={i} key={out.partito} />
    })

    minmax = calcolaMinMax(stato.matrice)

    arrayEffetti = stato.matrice[stato.partitoSelezionato].map((effetto, i) => <RigaEffetto 
      partito={stato.partiti[i]} 
      effetto={effetto} 
      max={minmax[1]}
      min={minmax[0]}
      key={stato.partiti[i]}
    />)
  }



  return (
    <>
      <CssBaseline />
      <Container maxWidth="md" sx={{paddingTop : 1}}>
        <Grid container spacing={4}>

          <Grid item xs={12}>
            <Typography variant="h4" gutterBottom>Chi mi conviene votare?</Typography>
            <Typography variant="body1" maxWidth={"md"}>
              Un calcolatore del "voto utile" per le Europee 2024: 
              scopri come il voto può aiutare (o ostacolare)
              l'elezione dei candidati di ciascuna lista,
              indica le liste che ti rappresentano di più,
              e calcola il voto più efficace per rendere il Parlamento Europeo
              più vicino alle tue iee.
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <div className='riga-seleziona-partito'>
              <Typography variant="h6" sx={{marginRight : 1}}>Effetti di un voto a&nbsp;</Typography>

              <FormControl variant='standard' sx={{ minWidth: 90, marginBottom: 1}}>
                {/* <InputLabel id="seleziona-partito-label">Lista</InputLabel> */}
                <Select
                  id="seleziona-partito"
                  value={stato ? stato.partitoSelezionato.toString() : ''}
                  label="Lista"
                  onChange={aggiornaPartitoSelezionato}
                >
                  {stato?.partiti.map((partito, i) => <MenuItem value={i} key={partito}>{partito}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            <Typography variant="body1">
              I numeri indicano quali sono le probabilità (su un milione) che un voto 
              a {stato?.partiti[stato.partitoSelezionato]} aggiunga (o tolga) un seggio a ciascuna di queste liste:
            </Typography>            
            <List>
              {arrayEffetti}
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6">Quanto ti rappresentano queste liste?</Typography>
            <Typography variant="body1">
              Indicalo cliccando sulle faccine, e la pagina calcolerà qual è il voto che più probabilmente
              aiuterà ad eleggere persone vicine alle tue idee.
            </Typography>
            <List>
              {arrayPreferenze}
            </List>            
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6">Voto più efficace</Typography>
            <Typography variant="body1">
              Più il punteggio è alto, più è probabile che dare il voto alla lista indicata
              contribuisca ad eleggere persone vicine alle tue idee.
            </Typography>
            <List>
              {arrayOutput}
            </List>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>A cosa serve questa cosa?</Typography>
            <Typography gutterBottom>
              Tutto nasce da una domanda che mi sono fatto.
            </Typography>
            <Typography gutterBottom>
              Alle elezioni Europee c'è uno sbarramento del 4%:
              se una lista non arriva ad avere il 4% dei voti validi, non elegge nessuno.
            </Typography>
            <Typography gutterBottom>
              Mi sono quindi chiesto: se voto una lista che potrebbe non raggiungere il 4%,
              è più probabile che il mio voto contribuisca a superare la soglia
              (e quindi eleggere persone che mi rappresentano), oppure è più probabile
              che la lista rimanga sotto la soglia?
            </Typography>
            <Typography gutterBottom>
              Sarebbe più efficace votare una lista da cui mi sento un po' meno rappresentato,
              ma che sicuramente supererà la soglia?
            </Typography>
            <Typography gutterBottom>
              Quale di queste due opzioni renderebbe, nel complesso,
              il Parlamento Europeo più vicino alle mie idee?
            </Typography>
            <Typography gutterBottom>
              Per rispondere a questa domanda ho realizzato questa web app.
              Partendo dai risultati dei sondaggi elettorali, stima la probabilità
              che, aggiungendo un voto in più ad una lista, aumentino o diminuiscano
              i seggi assegnati alle varie liste. Pesa poi questi seggi in più o in meno
              in base a quanto mi sento rappresentato da ciascuna lista:
              se un voto fa aumentare i seggi di una lista da cui mi sento rappresentato
              il punteggio aumenta, se fa aumentare i seggi di una lista 
              da cui non mi sento rappresentato il punteggio diminuisce.
              La scelta di voto che ottiene il punteggio più alto è quella che,
              probabilmente, permette eleggere un maggior numero di persone dalle quali
              mi sento rappresentato e/o un minor numero di persone dalle quali
              non mi sento rappresentato.
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Come funziona?</Typography>
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
              Questo risultato è quello visibile nella prima tabella.                                    
            </Typography>
            <Typography gutterBottom>
              A questo punto moltiplico ciascuno di questi numeri per la preferenza che ho assegnato:
            </Typography>
            <Grid container columns={5} justifyContent={'space-between'}>
              <Grid item>
                -2 per <SentimentVeryDissatisfiedIcon color="error" />
              </Grid>
              <Grid item>
                -1 per <SentimentDissatisfiedIcon color="error" />
              </Grid>
              <Grid item>
                0 per <SentimentSatisfiedIcon color="warning" />
              </Grid>
              <Grid item>
                +1 per <SentimentSatisfiedAltIcon color="success" />
              </Grid>
              <Grid item>
                +2 per <SentimentVerySatisfiedIcon color="success" />
              </Grid>
            </Grid>
            <Typography gutterBottom>
              Ad esempio, se un voto ad Alleanza Verdi e Sinistra in media aggiunge tre milionesimi di seggio ad Alleanza Verdi e Sinistra
              ma nello stesso tempo ne toglie un milionesimo al Partito Democratico, 
              e ho segnato 
              <SentimentSatisfiedAltIcon color="success" /> per Alleanza Verdi e Sinistra
              e <SentimentVerySatisfiedIcon color="success" /> per il Partito Democratico,
              il punteggio sarà di ( 3 milionesimi x 1 ) + ( - 1 milionesimo x 2) = +1
            </Typography>
            <Typography gutterBottom>
              Questo viene ripetuto per ciascun partito:
              votare il partito con il punteggio più alto sarà quindi la scelta che,
              in media, aumenterà di più il numero di persone che mi rappresentano nel Parlamento Europeo.
            </Typography>
                
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>
              Dettagli sul <a href="https://github.com/fornaeffe/valore_voto">repository di github</a>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>
              In questa pagina non vengono raccolti dati né viene fatto uso di cookie.
            </Typography>
            <Typography gutterBottom>
              Creato da Luca Fornasari. Disclaimer: per trasparenza, avviso che sono iscritto al partito Europa Verde.
            </Typography>
          </Grid>
        </Grid>
        
        
        
      </Container>
      
    </>
  )
}

export default App
