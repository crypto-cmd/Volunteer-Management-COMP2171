import type { ReactNode } from "react";

type ModuleCardProps = {
    title: string;
    description: string;
    icon: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    cardClassName?: string;
    iconClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
};

export default function ModuleCard({
    title,
    description,
    icon,
    onClick,
    disabled = false,
    cardClassName = "",
    iconClassName = "",
    titleClassName = "",
    descriptionClassName = "",
}: ModuleCardProps) {
    const isClickable = Boolean(onClick) && !disabled;

    return (
        <div
            onClick={isClickable ? onClick : undefined}
            className={[
                "p-6 rounded-xl border flex flex-col items-center text-center",
                isClickable
                    ? "bg-white shadow-sm border-gray-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                    : "cursor-not-allowed",
                cardClassName,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div
                className={[
                    "w-16 h-16 rounded-full flex items-center justify-center mb-4 text-2xl",
                    iconClassName,
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                {icon}
            </div>
            <h2 className={["text-xl font-semibold mb-2", titleClassName].filter(Boolean).join(" ")}>{title}</h2>
            <p className={["text-sm", descriptionClassName].filter(Boolean).join(" ")}>{description}</p>
        </div>
    );
}