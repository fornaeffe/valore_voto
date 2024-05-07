import Typography from '@mui/material/Typography';
import Preferenza from "./Preferenza";

export default function RigaPreferenza(props : {nome : string, i : number, onChange : (e: React.SyntheticEvent<Element, Event>, value : number|null) => void}) {
    return <>
        <Typography variant="body1">{props.nome}</Typography>
        <Preferenza i={props.i} onChange={props.onChange}/>
    </>
}