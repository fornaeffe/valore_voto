import './RigaEffetto.css'
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';


export default function RigaOutput(props: {partito: string, effetto: number, min: number, max: number}) {

    const zero = Math.abs(props.min / (props.max - props.min)) * 100
    const larghezza = Math.abs(props.effetto / (props.max - props.min)) * 100
    const margine = props.effetto > 0 ? zero : zero - larghezza

    return <ListItem dense>
        <div className='contenitore-riga-effetto'>
            <ListItemText primary={
                props.partito + 
                ": " + 
                (props.effetto > 0 ? "+" : (props.effetto < 0 ? "-" : "") ) +
                " " +
                Math.abs(props.effetto).toFixed(1)
            } />
            
            <div className='barra' style={{ 
                width : larghezza + '%', 
                backgroundColor: props.effetto > 0 ? 'green' : 'red',
                marginLeft : margine + '%'
            }}></div>
        </div>
        
             
    </ListItem>
    
}
