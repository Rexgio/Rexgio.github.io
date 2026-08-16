import { useEffect, useMemo, useState } from "react";

type ContributionDay = {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
};

type ContributionResponse = {
    total: Record<string, number>;
    contributions: ContributionDay[];
};

interface GithubChartProps {
    username: string;
    year?: string;
}

const LEVEL_COLORS = [
    "rgba(158,206,106,0.08)",
    "rgba(158,206,106,0.35)",
    "rgba(158,206,106,0.55)",
    "rgba(158,206,106,0.75)",
    "rgba(158,206,106,1)",
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function GithubChart({
    username,
    year = "last",
}: GithubChartProps) {
    const [data, setData] = useState<ContributionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [hovered, setHovered] = useState<ContributionDay | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(
            `https://github-contributions-api.jogruber.de/v4/${username}?y=${year}`,
        )
            .then((res) => {
                if (!res.ok) throw new Error("no se pudo cargar el usuario");
                return res.json();
            })
            .then((json: ContributionResponse) => {
                if (!cancelled) setData(json);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message ?? "error desconocido");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [username, year]);

    const weeks = useMemo(() => {
        if (!data) return [];
        const days = data.contributions;
        if (days.length === 0) return [];

        const firstDay = new Date(days[0].date).getDay(); // 0 = domingo
        const padded: (ContributionDay | null)[] = Array(firstDay).fill(null);
        padded.push(...days);

        const result: (ContributionDay | null)[][] = [];
        for (let i = 0; i < padded.length; i += 7) {
            result.push(padded.slice(i, i + 7));
        }
        return result;
    }, [data]);

    const totalKey = year === "last" ? "lastYear" : year;
    const total =
        data?.total?.[totalKey] ??
        data?.total?.[Object.keys(data?.total ?? {})[0]] ??
        0;

    return (
        <div className="font-mono w-full">
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-1">
                <p className="font-[900] text-[#F7768E]"># github/{username}</p>
                {!loading && !error && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {total} contribuciones
                    </p>
                )}
            </div>

            <div className="w-full mb-2">
                <hr className="border-[#9777D0] opacity-30" />
            </div>

            <div className="relative rounded-lg bg-neutral-200 dark:bg-tokyo-bgDark p-4 overflow-x-auto">
                {loading && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">
                        cargando contribuciones...
                    </p>
                )}

                {error && (
                    <p className="text-sm text-[#F7768E]">
                        no se pudieron cargar las contribuciones de "{username}
                        ".
                    </p>
                )}

                {!loading && !error && weeks.length > 0 && (
                    <>
                        <div className="flex gap-[3px] min-w-max">
                            <div className="flex flex-col gap-[3px] mr-1 text-[9px] text-neutral-500 dark:text-neutral-400 justify-between">
                                {DAY_LABELS.map((label, i) => (
                                    <span
                                        key={i}
                                        className="h-[10px] leading-[10px]"
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>

                            {weeks.map((week, wi) => (
                                <div
                                    key={wi}
                                    className="flex flex-col gap-[3px]"
                                >
                                    {week.map((day, di) =>
                                        day ? (
                                            <div
                                                key={di}
                                                onMouseEnter={() =>
                                                    setHovered(day)
                                                }
                                                onMouseLeave={() =>
                                                    setHovered(null)
                                                }
                                                className="w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-transform hover:scale-125"
                                                style={{
                                                    backgroundColor:
                                                        LEVEL_COLORS[day.level],
                                                }}
                                            />
                                        ) : (
                                            <div
                                                key={di}
                                                className="w-[10px] h-[10px]"
                                            />
                                        ),
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-3 text-[10px] text-neutral-500 dark:text-neutral-400">
                            <span className="h-[14px]">
                                {hovered
                                    ? `${hovered.count} contribuciones el ${hovered.date}`
                                    : "pasa el cursor sobre un día"}
                            </span>

                            <div className="flex items-center gap-1">
                                <span>less</span>
                                {LEVEL_COLORS.map((color, i) => (
                                    <div
                                        key={i}
                                        className="w-[10px] h-[10px] rounded-[2px]"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <span>more</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
