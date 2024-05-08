import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';

export type Output = {
    partito: string,
    valore: number
  }

export default function RigaOutput(props: {output : Output, i : number}) {

    if (props.i === 0 && props.output.valore !== 0) {
        return <Paper sx={{bgcolor : 'lightgreen'}}>
            <ListItem>
                <ListItemText primary={props.output.partito} secondary={"punteggio: "+props.output.valore.toFixed(1)} /> 
            </ListItem>
        </Paper>
    }

    return <ListItem>
        <ListItemText primary={props.output.partito} secondary={"punteggio: "+props.output.valore.toFixed(1)} />        
    </ListItem>
    
}
