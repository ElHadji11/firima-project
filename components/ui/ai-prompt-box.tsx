import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUp, Paperclip, Square, X, StopCircle, Mic, Globe, BrainCog, FolderCode, Zap, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Siriwave from "react-siriwave";
import { useAuth } from '@clerk/nextjs';
import { getGuestUsedCredits } from "@/lib/utils";
import Link from "next/link";

// Utility function for className merging
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// Embedded CSS for minimal custom styles
const styles = `
  *:focus-visible {
    outline-offset: 0 !important;
    --ring-offset: 0 !important;
  }
  textarea::-webkit-scrollbar {
    width: 6px;
  }
  textarea::-webkit-scrollbar-track {
    background: transparent;
  }
  textarea::-webkit-scrollbar-thumb {
    background-color: #444444;
    border-radius: 3px;
  }
  textarea::-webkit-scrollbar-thumb:hover {
    background-color: #555555;
  }
`;

// Inject styles into document
if (typeof document !== "undefined") {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
    <textarea
        className={cn(
            "flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none scrollbar-thin scrollbar-thumb-[#444444] scrollbar-track-transparent hover:scrollbar-thumb-[#555555]",
            className
        )}
        ref={ref}
        rows={1}
        {...props}
    />
));
Textarea.displayName = "Textarea";

// Tooltip Components
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            "z-50 overflow-hidden rounded-md border border-[#333333] bg-[#1F2023] px-3 py-1.5 text-sm text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Dialog Components
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-[#333333] bg-[#1F2023] p-0 shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl",
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-[#2E3033]/80 p-2 hover:bg-[#2E3033] transition-all">
                <X className="h-5 w-5 text-gray-200 hover:text-white" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight text-gray-100", className)}
        {...props}
    />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variantClasses = {
            default: "bg-white hover:bg-white/80 text-black",
            outline: "border border-[#444444] bg-transparent hover:bg-[#3A3A40]",
            ghost: "bg-transparent hover:bg-[#3A3A40]",
        };
        const sizeClasses = {
            default: "h-10 px-4 py-2",
            sm: "h-8 px-3 text-sm",
            lg: "h-12 px-6",
            icon: "h-8 w-8 rounded-full aspect-[1/1]",
        };
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

// VoiceRecorder Component
interface VoiceRecorderProps {
    isRecording: boolean;
    duration: number;
}
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    isRecording,
    duration,
}) => {
    const [amplitude, setAmplitude] = React.useState(0);

    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isRecording) {
            interval = setInterval(() => {
                setAmplitude(Math.random() * 2.5);
            }, 100);
        } else {
            setAmplitude(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div
            className={cn(
                "fixed z-50 flex flex-col items-center justify-center transition-all duration-300 ease-in-out pointer-events-none",
                isRecording ? "opacity-100" : "opacity-0 scale-95",
                "inset-0 bg-[#1F2023]/80 backdrop-blur-md",
                "md:inset-auto md:top-12 md:left-1/2 md:-translate-x-1/2 md:bg-[#1F2023] md:px-12 md:py-6 md:rounded-[2rem] md:shadow-2xl md:border md:border-[#333333] md:backdrop-blur-none"
            )}
        >
            {isRecording && (
                <div className="flex flex-col items-center gap-4 pointer-events-auto">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-[#3B82F6]/20 animate-ping" />
                        <div className="relative z-10 rounded-full border-2 border-[#3B82F6] bg-[#2E3033] p-4 text-[#60A5FA]">
                            <Mic className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="h-[100px] w-[300px] overflow-hidden md:w-[400px] flex items-center justify-center">
                        <Siriwave
                            theme="ios9"
                            width={400}
                            height={100}
                            speed={0.1}
                            amplitude={amplitude}
                            autostart
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-[#444444] bg-[#2E3033] px-4 py-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="font-mono text-sm font-medium tracking-wider text-white">
                            {formatTime(duration)}
                        </span>
                    </div>

                    <p className="mt-2 text-sm text-white/50 animate-pulse md:hidden">
                        Listening to pronunciation...
                    </p>
                </div>
            )}
        </div>
    );
};

// ImageViewDialog Component
interface ImageViewDialogProps {
    imageUrl: string | null;
    onClose: () => void;
}
const ImageViewDialog: React.FC<ImageViewDialogProps> = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
        <Dialog open={!!imageUrl} onOpenChange={onClose}>
            <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[90vw] md:max-w-[800px]">
                <DialogTitle className="sr-only">Image Preview</DialogTitle>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative bg-[#1F2023] rounded-2xl overflow-hidden shadow-2xl"
                >
                    <img
                        src={imageUrl}
                        alt="Full preview"
                        className="w-full max-h-[80vh] object-contain rounded-2xl"
                    />
                </motion.div>
            </DialogContent>
        </Dialog>
    );
};

// PromptInput Context and Components
interface PromptInputContextType {
    isLoading: boolean;
    value: string;
    setValue: (value: string) => void;
    maxHeight: number | string;
    onSubmit?: () => void;
    disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({
    isLoading: false,
    value: "",
    setValue: () => { },
    maxHeight: 240,
    onSubmit: undefined,
    disabled: false,
});
function usePromptInput() {
    const context = React.useContext(PromptInputContext);
    if (!context) throw new Error("usePromptInput must be used within a PromptInput");
    return context;
}

interface PromptInputProps {
    isLoading?: boolean;
    value?: string;
    onValueChange?: (value: string) => void;
    maxHeight?: number | string;
    onSubmit?: () => void;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
    (
        {
            className,
            isLoading = false,
            maxHeight = 240,
            value,
            onValueChange,
            onSubmit,
            children,
            disabled = false,
            onDragOver,
            onDragLeave,
            onDrop,
        },
        ref
    ) => {
        const [internalValue, setInternalValue] = React.useState(value || "");
        const handleChange = (newValue: string) => {
            setInternalValue(newValue);
            onValueChange?.(newValue);
        };
        return (
            <TooltipProvider>
                <PromptInputContext.Provider
                    value={{
                        isLoading,
                        value: value ?? internalValue,
                        setValue: onValueChange ?? handleChange,
                        maxHeight,
                        onSubmit,
                        disabled,
                    }}
                >
                    <div
                        ref={ref}
                        className={cn(
                            "rounded-3xl border border-[#444444] bg-[#1F2023] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300",
                            isLoading && "border-red-500/70",
                            className
                        )}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    >
                        {children}
                    </div>
                </PromptInputContext.Provider>
            </TooltipProvider>
        );
    }
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps {
    disableAutosize?: boolean;
    placeholder?: string;
}
const PromptInputTextarea: React.FC<PromptInputTextareaProps & React.ComponentProps<typeof Textarea>> = ({
    className,
    onKeyDown,
    disableAutosize = false,
    placeholder,
    ...props
}) => {
    const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (disableAutosize || !textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
            typeof maxHeight === "number"
                ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
                : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
    }, [value, maxHeight, disableAutosize]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit?.();
        }
        onKeyDown?.(e);
    };

    return (
        <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn("text-base", className)}
            disabled={disabled}
            placeholder={placeholder}
            {...props}
        />
    );
};

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> { }
const PromptInputActions: React.FC<PromptInputActionsProps> = ({ children, className, ...props }) => (
    <div className={cn("flex items-center gap-2", className)} {...props}>
        {children}
    </div>
);

interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
    tooltip: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    side?: "top" | "bottom" | "left" | "right";
}
const PromptInputAction: React.FC<PromptInputActionProps> = ({
    tooltip,
    children,
    className,
    side = "top",
    ...props
}) => {
    const { disabled } = usePromptInput();
    return (
        <Tooltip {...props}>
            <TooltipTrigger asChild disabled={disabled}>
                {children}
            </TooltipTrigger>
            <TooltipContent side={side} className={className}>
                {tooltip}
            </TooltipContent>
        </Tooltip>
    );
};

// Custom Divider Component
const CustomDivider: React.FC = () => (
    <div className="relative h-6 w-[1.5px] mx-1">
        <div
            className="absolute inset-0 bg-gradient-to-t from-transparent via-[#9b87f5]/70 to-transparent rounded-full"
            style={{
                clipPath: "polygon(0% 0%, 100% 0%, 100% 40%, 140% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -40% 50%, 0% 40%)",
            }}
        />
    </div>
);

// Main PromptInputBox Component
interface PromptInputBoxProps {
    onSend?: (message: string, files?: File[]) => void;
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
}
export const PromptInputBox = React.forwardRef((props: PromptInputBoxProps, ref: React.Ref<HTMLDivElement>) => {
    const { onSend = () => { }, isLoading = false, placeholder = "Type your message here...", className } = props;
    const [input, setInput] = React.useState("");
    const [guestRemaining, setGuestRemaining] = React.useState(4);
    const [memberCredits, setMemberCredits] = React.useState(50);
    const { isLoaded, isSignedIn } = useAuth();

    React.useEffect(() => {
        const used = getGuestUsedCredits();
        setGuestRemaining(Math.max(0, 4 - used));
    }, []);

    const [files, setFiles] = React.useState<File[]>([]);
    const [filePreviews, setFilePreviews] = React.useState<{ [key: string]: string }>({});
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const [isRecording, setIsRecording] = React.useState(false);
    const [recordingDuration, setRecordingDuration] = React.useState(0);
    const [pendingVoiceMessage, setPendingVoiceMessage] = React.useState<string | null>(null);
    const [pendingVoiceFile, setPendingVoiceFile] = React.useState<File | null>(null);
    const [pendingVoicePreviewUrl, setPendingVoicePreviewUrl] = React.useState<string | null>(null);
    const [showSearch, setShowSearch] = React.useState(false);
    const [showThink, setShowThink] = React.useState(false);
    const [showCanvas, setShowCanvas] = React.useState(false);
    const uploadInputRef = React.useRef<HTMLInputElement>(null);
    const promptBoxRef = React.useRef<HTMLDivElement>(null);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const recordingStreamRef = React.useRef<MediaStream | null>(null);
    const recordingChunksRef = React.useRef<Blob[]>([]);
    const recordingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const recordingDurationRef = React.useRef(0);
    const sendAfterStopRef = React.useRef(false);

    const handleToggleChange = (value: string) => {
        if (value === "search") {
            setShowSearch((prev) => !prev);
            setShowThink(false);
        } else if (value === "think") {
            setShowThink((prev) => !prev);
            setShowSearch(false);
        }
    };

    const handleCanvasToggle = () => setShowCanvas((prev) => !prev);

    const isImageFile = (file: File) => file.type.startsWith("image/");

    const processFile = (file: File) => {
        if (!isImageFile(file)) {
            console.log("Only image files are allowed");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            console.log("File too large (max 10MB)");
            return;
        }
        setFiles([file]);
        const reader = new FileReader();
        reader.onload = (e) => setFilePreviews({ [file.name]: e.target?.result as string });
        reader.readAsDataURL(file);
    };

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter((file) => isImageFile(file));
        if (imageFiles.length > 0) processFile(imageFiles[0]);
    }, []);

    const handleRemoveFile = (index: number) => {
        const fileToRemove = files[index];
        if (fileToRemove && filePreviews[fileToRemove.name]) setFilePreviews({});
        setFiles([]);
    };

    const openImageModal = (imageUrl: string) => setSelectedImage(imageUrl);

    const handlePaste = React.useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault();
                    processFile(file);
                    break;
                }
            }
        }
    }, []);

    React.useEffect(() => {
        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [handlePaste]);

    React.useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (recordingStreamRef.current) {
                recordingStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (pendingVoicePreviewUrl) {
                URL.revokeObjectURL(pendingVoicePreviewUrl);
            }
        };
    }, [pendingVoicePreviewUrl]);

    const clearPendingVoice = () => {
        if (pendingVoicePreviewUrl) {
            URL.revokeObjectURL(pendingVoicePreviewUrl);
        }
        setPendingVoicePreviewUrl(null);
        setPendingVoiceFile(null);
        setPendingVoiceMessage(null);
    };

    const handleSubmit = () => {
        if (isLoading) return;
        // If there's a pending voice message, send it
        if (pendingVoiceFile || pendingVoiceMessage) {
            const voiceLabel = pendingVoiceMessage ?? "[Voice message]";
            const payloadFiles = pendingVoiceFile ? [...files, pendingVoiceFile] : files;
            onSend(voiceLabel, payloadFiles.length > 0 ? payloadFiles : undefined);
            clearPendingVoice();
            setInput("");
            setFiles([]);
            setFilePreviews({});
        }
        // Otherwise send text message if there's content
        else if (input.trim() || files.length > 0) {
            let messagePrefix = "";
            if (showSearch) messagePrefix = "[Search: ";
            else if (showThink) messagePrefix = "[Think: ";
            else if (showCanvas) messagePrefix = "[Canvas: ";
            const formattedInput = messagePrefix ? `${messagePrefix}${input}]` : input;
            onSend(formattedInput, files);
            setInput("");
            setFiles([]);
            setFilePreviews({});
            clearPendingVoice();
        }
    };

    const startRecording = async () => {
        try {
            clearPendingVoice();
            setInput("");
            sendAfterStopRef.current = false;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);

            recordingStreamRef.current = stream;
            mediaRecorderRef.current = recorder;
            recordingChunksRef.current = [];
            recordingDurationRef.current = 0;
            setRecordingDuration(0);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordingChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }

                const duration = recordingDurationRef.current;
                const audioBlob = new Blob(recordingChunksRef.current, {
                    type: recorder.mimeType || "audio/webm",
                });

                if (audioBlob.size > 0 && duration > 0) {
                    const previewUrl = URL.createObjectURL(audioBlob);
                    const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
                        type: audioBlob.type || "audio/webm",
                    });
                    const voiceLabel = `[Voice message - ${duration} seconds]`;

                    if (sendAfterStopRef.current) {
                        const payloadFiles = [...files, file];
                        onSend(voiceLabel, payloadFiles);
                        clearPendingVoice();
                        setInput("");
                        setFiles([]);
                        setFilePreviews({});
                        URL.revokeObjectURL(previewUrl);
                    } else {
                        setPendingVoicePreviewUrl(previewUrl);
                        setPendingVoiceFile(file);
                        setPendingVoiceMessage(voiceLabel);
                    }
                }

                if (recordingStreamRef.current) {
                    recordingStreamRef.current.getTracks().forEach((track) => track.stop());
                    recordingStreamRef.current = null;
                }

                setIsRecording(false);
                sendAfterStopRef.current = false;
            };

            recorder.start();
            setIsRecording(true);

            recordingTimerRef.current = setInterval(() => {
                recordingDurationRef.current += 1;
                setRecordingDuration(recordingDurationRef.current);
            }, 1000);
        } catch (error) {
            console.error("Failed to start audio recording", error);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
    };

    const sendWhileRecording = () => {
        sendAfterStopRef.current = true;
        stopRecording();
    };

    const hasContent = input.trim() !== "" || files.length > 0 || pendingVoiceMessage !== null || pendingVoiceFile !== null;

    return (
        <>
            <PromptInput
                value={input}
                onValueChange={setInput}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                className={cn(
                    "w-full bg-[#1F2023] border-[#444444] shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300 ease-in-out",
                    isRecording && "border-red-500/70",
                    className
                )}
                disabled={isLoading || isRecording}
                ref={ref || promptBoxRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {files.length > 0 && !isRecording && (
                    <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
                        {files.map((file, index) => (
                            <div key={index} className="relative group">
                                {file.type.startsWith("image/") && filePreviews[file.name] && (
                                    <div
                                        className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                                        onClick={() => openImageModal(filePreviews[file.name])}
                                    >
                                        <img
                                            src={filePreviews[file.name]}
                                            alt={file.name}
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile(index);
                                            }}
                                            className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3 text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {pendingVoicePreviewUrl && !isRecording && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#444444] bg-[#24262A] px-3 py-2">
                        <audio className="h-8 w-full" controls src={pendingVoicePreviewUrl} preload="metadata" />
                        <button
                            type="button"
                            onClick={clearPendingVoice}
                            className="rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white"
                            aria-label="Remove voice preview"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                <div
                    className={cn(
                        "transition-all duration-300",
                        isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100"
                    )}
                >
                    <PromptInputTextarea
                        placeholder={
                            showSearch
                                ? "Search the web..."
                                : showThink
                                    ? "Think deeply..."
                                    : showCanvas
                                        ? "Create on canvas..."
                                        : placeholder
                        }
                        className="text-base"
                    />
                </div>

                <VoiceRecorder
                    isRecording={isRecording}
                    duration={recordingDuration}
                />

                <PromptInputActions className="flex items-center justify-between gap-2 p-0 pt-2">
                    <div
                        className={cn(
                            "flex items-center gap-1 transition-opacity duration-300",
                            isRecording ? "opacity-0 invisible h-0" : "opacity-100 visible"
                        )}
                    >
                        <PromptInputAction tooltip="Upload image">
                            <button
                                onClick={() => uploadInputRef.current?.click()}
                                className="flex h-8 w-8 text-[#9CA3AF] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-600/30 hover:text-[#D1D5DB]"
                                disabled={isRecording}
                            >
                                <Paperclip className="h-5 w-5 transition-colors" />
                                <input
                                    ref={uploadInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]);
                                        if (e.target) e.target.value = "";
                                    }}
                                    accept="image/*"
                                />
                            </button>
                        </PromptInputAction>

                        <div className="flex items-center ml-2 border-l border-[#444444] pl-3">
                            {!isLoaded ? (
                                <div className="flex items-center justify-center w-8">
                                    <Loader2 className="w-4 h-4 text-[#9CA3AF] animate-spin" />
                                </div>
                            ) : isSignedIn ? (
                                <Link href="/pricing" className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 border border-[#444444] rounded-full shadow-inner hidden min-[400px]:flex">
                                    <Zap className="w-3.5 h-3.5 text-accent group-hover:fill-accent transition-colors" />
                                    <span className="text-xs font-semibold text-accent">
                                        {memberCredits}
                                    </span>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 border border-[#444444] rounded-full shadow-inner hidden min-[400px]:flex">
                                    <Zap className="w-3.5 h-3.5 text-accent group-hover:fill-accent transition-colors" />
                                    <span className="text-xs font-semibold text-accent">
                                        {guestRemaining}
                                        <span className="hidden sm:inline"> essais libres</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => handleToggleChange("search")}
                                className={cn(
                                    "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
                                    showSearch
                                        ? "bg-[#1EAEDB]/15 border-[#1EAEDB] text-[#1EAEDB]"
                                        : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]"
                                )}
                            >
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    <motion.div
                                        animate={{ rotate: showSearch ? 360 : 0, scale: showSearch ? 1.1 : 1 }}
                                        whileHover={{ rotate: showSearch ? 360 : 15, scale: 1.1, transition: { type: "spring", stiffness: 300, damping: 10 } }}
                                        transition={{ type: "spring", stiffness: 260, damping: 25 }}
                                    >
                                        <Globe className={cn("w-4 h-4", showSearch ? "text-[#1EAEDB]" : "text-inherit")} />
                                    </motion.div>
                                </div>
                                <AnimatePresence>
                                    {showSearch && (
                                        <motion.span
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: "auto", opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-xs overflow-hidden whitespace-nowrap text-[#1EAEDB] flex-shrink-0"
                                        >
                                            Search
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>

                            <CustomDivider />

                            <button
                                type="button"
                                onClick={() => handleToggleChange("think")}
                                className={cn(
                                    "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
                                    showThink
                                        ? "bg-[#8B5CF6]/15 border-[#8B5CF6] text-[#8B5CF6]"
                                        : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]"
                                )}
                            >
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    <motion.div
                                        animate={{ rotate: showThink ? 360 : 0, scale: showThink ? 1.1 : 1 }}
                                        whileHover={{ rotate: showThink ? 360 : 15, scale: 1.1, transition: { type: "spring", stiffness: 300, damping: 10 } }}
                                        transition={{ type: "spring", stiffness: 260, damping: 25 }}
                                    >
                                        <BrainCog className={cn("w-4 h-4", showThink ? "text-[#8B5CF6]" : "text-inherit")} />
                                    </motion.div>
                                </div>
                                <AnimatePresence>
                                    {showThink && (
                                        <motion.span
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: "auto", opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-xs overflow-hidden whitespace-nowrap text-[#8B5CF6] flex-shrink-0"
                                        >
                                            Think
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>

                            <CustomDivider />

                            <button
                                type="button"
                                onClick={handleCanvasToggle}
                                className={cn(
                                    "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
                                    showCanvas
                                        ? "bg-[#F97316]/15 border-[#F97316] text-[#F97316]"
                                        : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]"
                                )}
                            >
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    <motion.div
                                        animate={{ rotate: showCanvas ? 360 : 0, scale: showCanvas ? 1.1 : 1 }}
                                        whileHover={{ rotate: showCanvas ? 360 : 15, scale: 1.1, transition: { type: "spring", stiffness: 300, damping: 10 } }}
                                        transition={{ type: "spring", stiffness: 260, damping: 25 }}
                                    >
                                        <FolderCode className={cn("w-4 h-4", showCanvas ? "text-[#F97316]" : "text-inherit")} />
                                    </motion.div>
                                </div>
                                <AnimatePresence>
                                    {showCanvas && (
                                        <motion.span
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: "auto", opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-xs overflow-hidden whitespace-nowrap text-[#F97316] flex-shrink-0"
                                        >
                                            Canvas
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div> */}
                    </div>

                    {isRecording && (
                        <PromptInputAction tooltip="Stop recording">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-transparent hover:bg-gray-600/30 text-red-500 hover:text-red-400"
                                onClick={stopRecording}
                                disabled={isLoading}
                            >
                                <StopCircle className="h-5 w-5 text-red-500" />
                            </Button>
                        </PromptInputAction>
                    )}

                    <PromptInputAction
                        tooltip={
                            isLoading
                                ? "Stop generation"
                                : isRecording
                                    ? "Send voice message"
                                    : pendingVoiceFile
                                        ? "Send voice message"
                                        : hasContent
                                            ? "Send message"
                                            : "Voice message"
                        }
                    >
                        <Button
                            variant="default"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                isRecording
                                    ? "bg-white hover:bg-white/80 text-[#1F2023]"
                                    : hasContent
                                        ? "bg-white hover:bg-white/80 text-[#1F2023]"
                                        : "bg-transparent hover:bg-gray-600/30 text-[#9CA3AF] hover:text-[#D1D5DB]"
                            )}
                            onClick={() => {
                                if (isRecording) sendWhileRecording();
                                else if (hasContent) handleSubmit();
                                else startRecording();
                            }}
                            disabled={isLoading && !hasContent}
                        >
                            {isLoading ? (
                                <Square className="h-4 w-4 fill-[#1F2023] animate-pulse" />
                            ) : isRecording ? (
                                <ArrowUp className="h-4 w-4 text-[#1F2023]" />
                            ) : hasContent ? (
                                <ArrowUp className="h-4 w-4 text-[#1F2023]" />
                            ) : (
                                <Mic className="h-5 w-5 text-[#1F2023] transition-colors" />
                            )}
                        </Button>
                    </PromptInputAction>
                </PromptInputActions>
            </PromptInput>

            <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
        </>
    );
});
PromptInputBox.displayName = "PromptInputBox";
