import ModuleCard from "@components/ModuleCard";

type HomeProps = {
  navigateTo: (view: string) => void;
};

type ModuleCardConfig = {
  key: string;
  title: string;
  description: string;
  icon: string;
  onClickView?: string;
  disabled?: boolean;
  cardClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

const moduleCards: ModuleCardConfig[] = [
  {
    key: "timesheet",
    title: "My Timesheet",
    description: "View your logged hours, track your attendance history, and see your impact.",
    icon: "⏱️",
    onClickView: "timesheet",
    iconClassName: "bg-blue-100 text-blue-600",
    titleClassName: "text-gray-800",
    descriptionClassName: "text-gray-600",
  },
  {
    key: "events",
    title: "Activities & Events",
    description: "Browse upcoming volunteer opportunities and register.",
    icon: "📅",
    onClickView: "events",
    iconClassName: "bg-blue-200 text-gray-500",
    titleClassName: "text-gray-800",
    descriptionClassName: "text-gray-500",
  },
  {
    key: "awards",
    title: "Awards & Badges",
    description: "View your achievements and milestones. (Coming Soon)",
    icon: "🏆",
    disabled: true,
    cardClassName: "bg-gray-50 border-gray-200 opacity-60",
    iconClassName: "bg-gray-200 text-gray-500",
    titleClassName: "text-gray-800",
    descriptionClassName: "text-gray-500",
  },
];

export default function Home({ navigateTo }: HomeProps) {
  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Volunteer Management System</h1>
        <p className="text-xl text-gray-600">Faculty of Science and Technology Guild Committee</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleCards.map((card) => (
          <ModuleCard
            key={card.key}
            title={card.title}
            description={card.description}
            icon={card.icon}
            onClick={card.onClickView ? () => navigateTo(card.onClickView) : undefined}
            disabled={card.disabled}
            cardClassName={card.cardClassName}
            iconClassName={card.iconClassName}
            titleClassName={card.titleClassName}
            descriptionClassName={card.descriptionClassName}
          />
        ))}
      </div>
    </div>
  );
}
