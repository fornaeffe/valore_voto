import Typography from '@mui/material/Typography';

export type Output = {
    partito: string,
    valore: number
  }

export default function RigaOutput(props: {output : Output, i : number}) {
    return <>
        <Typography variant="body1">{props.output.partito}</Typography>
        <Typography variant="body1" textAlign="right">{props.output.valore.toFixed(1)}</Typography>
    </>
}