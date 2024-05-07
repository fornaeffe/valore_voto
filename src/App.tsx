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
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

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
    arrayPreferenze = stato.partiti.map((partito, i) => <RigaPreferenza key={i} nome={partito} i={i} onChange={(e, value) => aggiornaPreferenze(i, value) } />)

    output = stato.partiti.map((partito, i) => ({
      partito: partito,
      valore: stato.preferenze.reduce((a, pref, j) => a + pref * stato.matrice[i][j], 0)
    }))

    output.sort((a, b) => b.valore - a.valore)

    arrayOutput = output.map((out, i) => {
      return <RigaOutput output={out} i={i} key={i} />
    })
  }



  return (
    <>
      <CssBaseline />
      <Container>
        <Stack spacing={2} display="flex" alignItems="center">
          <Typography variant="h4">Chi mi conviene votare?</Typography>
          <Box>
            <Typography variant="subtitle1">Quanto ti rappresentano questi partiti?</Typography>
            <div className="griglia-preferenze">
              {arrayPreferenze}
            </div>
          </Box>
          <Box>
            <Typography variant="subtitle1">Ti conviene votare:</Typography>
            <div className="griglia-output">
              {arrayOutput}
            </div>
          </Box>
        </Stack>
        
        
        
      </Container>
      
    </>
  )
}

export default App
