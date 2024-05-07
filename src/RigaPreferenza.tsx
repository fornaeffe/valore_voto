import Preferenza from "./Preferenza";
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid';

export default function RigaPreferenza(props : {nome : string, i : number, onChange : (e: React.SyntheticEvent<Element, Event>, value : number|null) => void}) {
    return <ListItem>
        <Grid container spacing={2}>
            <Grid item xs={6}>
                <ListItemText primary={props.nome} />
            </Grid>
            <Grid item xs={6}>
            <Preferenza i={props.i} onChange={props.onChange}/>
            </Grid>
        </Grid>
        
    </ListItem>
}