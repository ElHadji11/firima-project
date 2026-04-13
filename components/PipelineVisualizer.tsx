// import { Mic, FileText, Languages, Volume2 } from 'lucide-react';

// type Step = {
//     id: number;
//     title: string;
//     description: string;
//     status: string;
//     icon: React.ElementType;
// };

// const pipelineSteps: Step[] = [
//     {
//         id: 1,
//         title: 'Capture Audio',
//         description: "Capture l'audio, normalise le volume et segmente.",
//         status: 'EN ATTENTE...',
//         icon: Mic,
//     },
//     {
//         id: 2,
//         title: 'Parole en texte (STT)',
//         description: 'API Whisper pour transcrire audio en texte francais.',
//         status: 'EN ATTENTE...',
//         icon: FileText,
//     },
//     {
//         id: 3,
//         title: 'Traduction de texte',
//         description: 'GPT-4o traduit contextuellement en wolof (Senegal).',
//         status: 'EN ATTENTE...',
//         icon: Languages,
//     },
//     {
//         id: 4,
//         title: 'Texte en parole (TTS)',
//         description: 'OpenAI TTS convertit le texte en audio haute fidelite.',
//         status: 'EN ATTENTE...',
//         icon: Volume2,
//     },
// ];

// export default function PipelineVisualizer({ activeStep = 0 }: { activeStep?: number }) {
//     return (
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//             {pipelineSteps.map((step) => {
//                 const Icon = step.icon;
//                 const isActive = activeStep === step.id;

//                 return (
//                     <div
//                         key={step.id}
//                         className={`rounded-xl border p-5 text-center transition-colors ${isActive ? 'border-primary/70 bg-primary/10' : 'border-border/50 bg-card/60'
//                             }`}
//                     >
//                         <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-foreground/80">
//                             <Icon className="h-5 w-5" />
//                         </div>
//                         <p className="text-xl font-semibold text-foreground">{step.id}. {step.title}</p>
//                         <p className="mt-2 text-sm text-foreground/70">{step.description}</p>
//                         <div className="mt-4 inline-flex rounded-full border border-border/70 px-3 py-1 text-[11px] font-semibold text-foreground/70">
//                             {isActive ? 'EN COURS...' : step.status}
//                         </div>
//                     </div>
//                 );
//             })}
//         </div>
//     );
// }