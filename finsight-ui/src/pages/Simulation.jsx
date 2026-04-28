import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Layers,
  AlertCircle,
  CheckCircle,
  Activity,
  Percent,
  Clock,
  Zap,
  Shield,
  PieChart,
  Calendar,
  Loader2,
  Info,
  Sparkles,
  HelpCircle,
  FileText,
  Download,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { runSimulation, getStrategy } from "../api/summary";
import Sidebar from "../components/Sidebar";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const STRATEGIES = [
  "CASH_ONLY",
  "CONSERVATIVE",
  "BALANCED",
  "AGGRESSIVE",
  "FIXED_DEPOSIT",
];

const STRATEGY_METADATA = {
  CASH_ONLY: {
    name: "Cash Only",
    description:
      "All funds are kept in cash or savings accounts (e.g., bank balance, savings accounts, money market funds). No exposure to stocks or bonds.",
    guidance:
      "Best for safety. Your money won't grow much, but it won't fluctuate either.",
    returns: "≈ 2–3% / year",
    risk: "Almost no risk",
    horizon: "Short-term (0–2 years)",
    volatility: "0.5%",
    suitableFor: "Emergency funds, short-term needs, risk-averse users",
  },

  CONSERVATIVE: {
    name: "Conservative",
    description:
      "Mostly low-risk investments like government bonds, fixed-income funds, and a small portion of stable stocks or dividend-paying companies.",
    guidance: "Good if you want your money to grow slowly without big drops.",
    returns: "≈ 5–6% / year",
    risk: "Low fluctuations",
    volatility: "6%",
    horizon: "2–5 years",
    suitableFor: "Capital preservation with some growth",
  },

  BALANCED: {
    name: "Balanced",
    description:
      "A mix of stocks (for growth) and bonds (for stability). Typically includes index funds, ETFs, blue-chip stocks, and government or corporate bonds.",
    guidance:
      "A strong default choice. Balances growth and safety for most users.",
    returns: "≈ 8–10% / year",
    risk: "Moderate ups & downs",
    volatility: "10%",
    horizon: "3–7+ years",
    suitableFor: "Long-term goals, retirement, general investing",
  },

  AGGRESSIVE: {
    name: "Aggressive",
    description:
      "Primarily invested in stocks, including growth stocks, tech companies, emerging markets, and equity-focused mutual funds or ETFs.",
    guidance:
      "Choose this if you want maximum growth and can handle market swings.",
    returns: "≈ 12–15% / year",
    risk: "High volatility",
    volatility: "18%",
    horizon: "5–10+ years",
    suitableFor: "Long-term wealth building, high risk tolerance",
  },

  FIXED_DEPOSIT: {
    name: "Fixed Deposit",
    description:
      "Money is locked into bank fixed deposits or term deposits with guaranteed interest. No exposure to market instruments.",
    guidance: "Best for guaranteed returns with zero uncertainty.",
    returns: "≈ 10–13% / year",
    risk: "No market risk",
    volatility: "1%",
    horizon: "Fixed term (e.g., 1–5 years)",
    suitableFor: "Guaranteed returns, planned expenses",
  },
};

const fmt = (n) =>
  new Intl.NumberFormat("en-PK", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

const fmtF = (n) => new Intl.NumberFormat("en-PK").format(n);

const StrategyTooltip = ({ children, strategy }) => {
  const meta = STRATEGY_METADATA[strategy];

  return (
    <div className="relative group">
      {children}
      <div className="absolute z-50 hidden group-hover:block top-full mt-2 left-1/2 -translate-x-1/2 w-64">
        <div className="p-3 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl text-xs">
          <div className="font-semibold text-slate-800 mb-1">{meta.name}</div>
          <p className="text-slate-600 mb-2 leading-snug">{meta.description}</p>
          <p className="text-indigo-600 font-medium mb-2">💡 {meta.guidance}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
            <span>Return: {meta.returns}</span>
            <span>Risk: {meta.risk}</span>
            <span>Horizon: {meta.horizon}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Simulation() {
  const userId = useAuthStore((s) => s.userId);
  const userName = useAuthStore((s) => s.fullName);

  const [userStrategy, setUserStrategy] = useState(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(true);

  const [cfg, setCfg] = useState({
    strategy: "BALANCED",
    years: 10,
    simulations: 10000,
    inflationRate: 0.06,
    includeLifeEvents: true,
    useSmoothed: true,
  });

  const [result, setResult] = useState(null);
  const [animateLine, setAnimateLine] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [pathsData, setPathsData] = useState([]);
  const [curveProgress, setCurveProgress] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [barProgress, setBarProgress] = useState(1);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const lineChartRef = useRef(null);
  const histRef = useRef(null);
  const barAnimationRef = useRef(null);
  const curveAnimationRef = useRef(null);

  useEffect(() => {
    const fetchUserStrategy = async () => {
      if (!userId) return;

      setIsLoadingStrategy(true);
      try {
        const response = await getStrategy(userId);
        const strategyFromApi = response.data?.strategy || response.data;

        if (strategyFromApi && STRATEGIES.includes(strategyFromApi)) {
          setUserStrategy(strategyFromApi);
          setCfg((prev) => ({ ...prev, strategy: strategyFromApi }));
        }
      } catch (error) {
        console.error("Failed to fetch user strategy:", error);
      } finally {
        setIsLoadingStrategy(false);
      }
    };

    fetchUserStrategy();
  }, [userId]);

  const animateHistogram = () => {
    if (barAnimationRef.current) clearInterval(barAnimationRef.current);
    if (curveAnimationRef.current) clearInterval(curveAnimationRef.current);

    setBarProgress(0);
    let barProgressValue = 0;
    barAnimationRef.current = setInterval(() => {
      barProgressValue += 0.05;
      setBarProgress(Math.min(barProgressValue, 1));

      if (barProgressValue >= 1) {
        clearInterval(barAnimationRef.current);
        setIsAnimating(true);
        setCurveProgress(0);
        let curveProgressValue = 0;
        curveAnimationRef.current = setInterval(() => {
          curveProgressValue += 0.025;
          setCurveProgress(Math.min(curveProgressValue, 1));
          if (curveProgressValue >= 1) {
            clearInterval(curveAnimationRef.current);
            setIsAnimating(false);
          }
        }, 16);
      }
    }, 16);
  };

  const sim = useMutation({
    mutationFn: () => runSimulation({ ...cfg, userId }).then((r) => r.data),
    onSuccess: (data) => {
      setResult(data);

      if (shouldAnimate) {
        setAnimateLine(false);
        setShowPaths(false);

        const fakePaths = generatePaths(data.trajectory, 25);
        setPathsData(fakePaths);

        setCurveProgress(0);
        setBarProgress(0);
        setIsAnimating(true);

        setTimeout(() => {
          lineChartRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);

        setTimeout(() => setShowPaths(true), 600);
        setTimeout(() => setShowPaths(false), 3000);
        setTimeout(() => setAnimateLine(true), 3000);

        setTimeout(() => {
          histRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          setTimeout(() => animateHistogram(), 300);
        }, 7000);
      } else {
        setCurveProgress(1);
        setBarProgress(1);
        setAnimateLine(true);
      }

      setShouldAnimate(false);
    },
  });

  useEffect(() => {
    if (userId && !isLoadingStrategy && userStrategy && !result) {
      setShouldAnimate(false);
      sim.mutate();
    }
  }, [userId, userStrategy, isLoadingStrategy]);

  useEffect(() => {
    return () => {
      if (barAnimationRef.current) clearInterval(barAnimationRef.current);
      if (curveAnimationRef.current) clearInterval(curveAnimationRef.current);
    };
  }, []);

  const generatePDF = async () => {
    if (!result) return;
    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      let isFirstPage = true;

      const addContentPage = async (contentHtml) => {
        const pageElement = document.createElement("div");
        pageElement.style.width = "800px";
        pageElement.style.backgroundColor = "white";
        pageElement.style.fontFamily = "Arial, sans-serif";
        pageElement.style.color = "#1e293b";
        pageElement.style.padding = "40px";
        pageElement.innerHTML = contentHtml;
        document.body.appendChild(pageElement);

        const canvas = await html2canvas(pageElement, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!isFirstPage) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        document.body.removeChild(pageElement);
        isFirstPage = false;
      };

      const page1Content = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #4f46e5; margin-bottom: 10px; font-size: 28px;">Financial Forecast Simulation Report</h1>
          <p style="color: #64748b; margin: 5px 0;">Generated for: <strong>${userName}</strong></p>
          <p style="color: #64748b; margin: 5px 0;">${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <hr style="margin: 20px 0; border-color: #e2e8f0;">
        </div>
        <div style="margin-bottom: 25px;">
          <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">Simulation Parameters</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; font-weight: bold; width: 50%;">Investment Strategy:</td>
              <td style="padding: 8px 0;">${STRATEGY_METADATA[cfg.strategy]?.name || cfg.strategy}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; font-weight: bold;">Time Horizon:</td>
              <td style="padding: 8px 0;">${cfg.years} years</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; font-weight: bold;">Simulation Runs:</td>
              <td style="padding: 8px 0;">${cfg.simulations.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; font-weight: bold;">Inflation Rate:</td>
              <td style="padding: 8px 0;">${(cfg.inflationRate * 100).toFixed(1)}%</td>
            </tr>
          </table>
        </div>
        <div style="margin-bottom: 25px;">
          <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">Strategy Overview</h2>
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>${STRATEGY_METADATA[cfg.strategy]?.name}</strong>: ${STRATEGY_METADATA[cfg.strategy]?.description}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Guidance</strong>: ${STRATEGY_METADATA[cfg.strategy]?.guidance}</p>
          </div>
        </div>
        <div style="margin-bottom: 25px;">
          <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">Returns Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="background-color: #f8fafc; padding: 12px; text-align: center; border-radius: 8px;">
              <p style="color: #64748b; margin-bottom: 6px; font-size: 12px;">Nominal Return</p>
              <p style="color: #4f46e5; font-size: 22px; font-weight: bold; margin: 0;">${(result.nominalReturn * 100).toFixed(1)}%</p>
            </div>
            <div style="background-color: #f8fafc; padding: 12px; text-align: center; border-radius: 8px;">
              <p style="color: #64748b; margin-bottom: 6px; font-size: 12px;">Inflation Impact</p>
              <p style="color: #f59e0b; font-size: 22px; font-weight: bold; margin: 0;">-${(result.inflationRate * 100).toFixed(1)}%</p>
            </div>
            <div style="background-color: #f8fafc; padding: 12px; text-align: center; border-radius: 8px;">
              <p style="color: #64748b; margin-bottom: 6px; font-size: 12px;">Real Return</p>
              <p style="color: ${result.realReturn < 0 ? "#ef4444" : "#10b981"}; font-size: 22px; font-weight: bold; margin: 0;">${(result.realReturn * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div style="margin-bottom: 25px;">
          <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">Outcome Percentiles</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="background-color: #fef2f2; padding: 12px; text-align: center; border-radius: 8px;">
              <p style="color: #64748b; margin-bottom: 6px; font-size: 12px;">Pessimistic (P10)</p>
              <p style="color: #ef4444; font-size: 18px; font-weight: bold; margin: 0;">PKR ${fmt(result.p10)}</p>
              <p style="color: #64748b; font-size: 10px; margin-top: 6px;">Only 10% below this</p>
            </div>
            <div style="background-color: #eef2ff; padding: 12px; text-align: center; border-radius: 8px;">
              <p style="color: #64748b; margin-bottom: 6px; font-size: 12px;">Median (P50)</p>
              <p style="color: #4f46e5; font-size: 18px; font-weight: bold; margin: 0;">PKR ${fmt(result.p50)}</p>
              <p style="color: #64748b; font-size: 10px; margin-top: 6px;">Middle outcome</p>
            </div>
            <div style="background-color: #f0fdf4; padding: 12px; text-align: center; border-radius: 8px;">
              <p style="color: #64748b; margin-bottom: 6px; font-size: 12px;">Optimistic (P90)</p>
              <p style="color: #10b981; font-size: 18px; font-weight: bold; margin: 0;">PKR ${fmt(result.p90)}</p>
              <p style="color: #64748b; font-size: 10px; margin-top: 6px;">Only 10% above this</p>
            </div>
          </div>
        </div>
      `;

      await addContentPage(page1Content);

      const lineChartImage = await captureChart(lineChartRef);
      const histChartImage = await captureChart(histRef);

      const page2Content = `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">Wealth Trajectory</h2>
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 10px;">
            <img src="${lineChartImage}" style="width: 100%; height: auto; display: block;" />
          </div>
          <p style="color: #64748b; font-size: 11px; margin-bottom: 20px;">Projected wealth growth over ${cfg.years} years (Nominal vs Inflation-adjusted)</p>
        </div>
        <div>
          <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">Distribution of Outcomes</h2>
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 10px;">
            <img src="${histChartImage}" style="width: 100%; height: auto; display: block;" />
          </div>
          <p style="color: #64748b; font-size: 11px;">Distribution of ${cfg.simulations.toLocaleString()} simulation outcomes with confidence intervals</p>
        </div>
      `;

      await addContentPage(page2Content);

      const probMetrics = result.probabilityMetrics || {};
      const stratComparison = result.strategyComparison || {};
      const realComparison = result.realComparison || {};

      const page3Content = `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">Goal Probability</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 10px; text-align: left; font-size: 12px;">Target (PKR)</th>
                <th style="padding: 10px; text-align: left; font-size: 12px;">Probability</th>
                <th style="padding: 10px; text-align: left; font-size: 12px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(probMetrics)
                .map(
                  ([target, prob]) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px; font-size: 12px;">${target}</td>
                  <td style="padding: 8px; font-weight: bold; color: ${prob > 70 ? "#10b981" : prob > 40 ? "#f59e0b" : "#ef4444"}; font-size: 12px;">${prob}%</td>
                  <td style="padding: 8px; font-size: 12px;">${prob > 70 ? "✓ On Track" : prob > 40 ? "⚠ Moderate Chance" : "✗ Low Chance"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">Strategy Comparison</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 10px; text-align: left;">Strategy</th>
                <th style="padding: 10px; text-align: right;">Nominal (${cfg.years}yr)</th>
                <th style="padding: 10px; text-align: right;">Real (${cfg.years}yr)</th>
                <th style="padding: 10px; text-align: right;">Expected Return</th>
                <th style="padding: 10px; text-align: right;">Volatility</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stratComparison)
                .map(([strat, val]) => {
                  const meta = STRATEGY_METADATA[strat];
                  const realVal = realComparison[strat] || val;
                  return `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold;">${meta?.name || strat}</td>
                    <td style="padding: 8px; text-align: right;">PKR ${fmt(val)}</td>
                    <td style="padding: 8px; text-align: right;">PKR ${fmt(realVal)}</td>
                    <td style="padding: 8px; text-align: right;">${meta?.returns || "N/A"}</td>
                    <td style="padding: 8px; text-align: right;">${meta?.volatility || "N/A"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
        ${
          insight
            ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; border-left: 4px solid #4f46e5; padding-left: 12px; margin-bottom: 15px; font-size: 18px;">AI Financial Insight</h2>
            <div style="background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%); padding: 15px; border-radius: 8px; border-left: 3px solid #4f46e5;">
              <p style="margin: 0; color: #1e293b; line-height: 1.5; font-size: 12px;">${insight}</p>
            </div>
          </div>
        `
            : ""
        }
        <div style="text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 10px; margin: 5px 0;">This report was generated by <b>FinSight</b>.</p>
          <p style="color: #94a3b8; font-size: 10px; margin: 5px 0;">Disclaimer: Past performance does not guarantee future results. This simulation is for informational purposes only.</p>
          <p style="color: #94a3b8; font-size: 9px; margin-top: 8px;">Report ID: ${Date.now()}</p>
        </div>
      `;

      await addContentPage(page3Content);
      pdf.save(
        `simulation_report_${userName.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const captureChart = async (chartRef) => {
    if (!chartRef.current) return null;
    try {
      const originalOverflow = chartRef.current.style.overflow;
      const originalPosition = chartRef.current.style.position;
      chartRef.current.style.overflow = "visible";
      chartRef.current.style.position = "relative";
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });
      chartRef.current.style.overflow = originalOverflow;
      chartRef.current.style.position = originalPosition;
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error capturing chart:", error);
      return null;
    }
  };

  // Process life events from simulation result
  const lifeEvents = result?.lifeEvents || [];
  const eventMap = {};

  lifeEvents.forEach((e) => {
    eventMap[e.atYear] = e;
  });

  // FIXED: Years start from 0 (Y0, Y1, Y2...)
  const chartData =
    result?.trajectory?.map((v, i) => ({
      year: `Y${i}`,  // Changed from Y${i+1} to Y${i}
      nominal: Math.round(v),
      real: Math.round(result.realTrajectory?.[i] ?? v),
      event: eventMap[i]?.eventName || null,
      eventAmount: eventMap[i]?.lumpSumAmount || eventMap[i]?.monthlyDelta,
      eventType: eventMap[i]?.type || null,
    })) ?? [];

  const histData = (() => {
    if (!result?.histogram || !result.histogram.length) return [];
    const min = Number(result.minOutcome) || 0;
    const max = Number(result.maxOutcome) || 10000000;
    const buckets = result.histogram.length;
    const step = (max - min) / buckets;
    return result.histogram.map((count, i) => {
      const start = min + i * step;
      const end = start + step;
      return {
        range: `${fmt(start)} - ${fmt(end)}`,
        mid: start + step / 2,
        count: count || 0,
        start,
        end,
      };
    });
  })();

  const median = Number(result?.p50) || 0;
  const p10 = Number(result?.p10) || 0;
  const p90 = Number(result?.p90) || 0;

  const modeBucket =
    histData.length > 0
      ? histData.reduce(
          (max, curr) => (curr.count > max.count ? curr : max),
          histData[0],
        )
      : null;
  const medianBucket =
    histData.length > 0
      ? histData.find((d) => d.mid >= median) || histData[histData.length - 1]
      : null;
  const maxCount =
    histData.length > 0 ? Math.max(...histData.map((d) => d.count)) : 1;

  const densityData = histData.map((d, i, arr) => {
    const prev = arr[i - 1]?.count || d.count;
    const next = arr[i + 1]?.count || d.count;
    const smooth = (prev + d.count + next) / 3;
    const finalDensity = (smooth / maxCount) * maxCount;
    const pointPosition = i / histData.length;
    const visible = pointPosition <= curveProgress;
    return {
      ...d,
      density: finalDensity,
      animatedDensity: visible ? finalDensity : 0,
      animatedCount: d.count * barProgress,
    };
  });

  const lossProbability = (() => {
    if (!result?.probabilityMetrics) return null;
    return (
      result.probabilityMetrics["0"] ||
      result.probabilityMetrics["-1000000"] ||
      0
    );
  })();

  const insight = (() => {
    if (!histData.length || !median) return "";
    const fmtVal = (val) => (val / 1000000).toFixed(1) + "M";
    const modeMid = modeBucket?.mid || 1;
    const modeText = modeBucket
      ? `The most likely outcome is PKR ${modeBucket.range} (${((modeBucket.count / cfg.simulations) * 100).toFixed(1)}% probability)`
      : "";
    const medianText = `while the median outcome is around PKR ${fmtVal(median)}`;

    let riskLevel = { text: "", emoji: "" };
    if (lossProbability !== null) {
      if (lossProbability < 5)
        riskLevel = { text: "with very low downside risk", emoji: "🟢" };
      else if (lossProbability < 25)
        riskLevel = { text: "with moderate downside risk", emoji: "🟡" };
      else riskLevel = { text: "with significant downside risk", emoji: "🔴" };
    }

    const skewRatio = median / modeMid;
    let skewAnalysis = { text: "", emoji: "" };
    if (skewRatio > 1.2)
      skewAnalysis = {
        text: "strong upside potential from market outliers",
        emoji: "🚀",
      };
    else if (skewRatio < 0.8)
      skewAnalysis = {
        text: "an ambitious most-likely target with a very stable floor",
        emoji: "🎯",
      };
    else
      skewAnalysis = {
        text: "a highly predictable and balanced growth path",
        emoji: "⚖️",
      };

    const confidenceRange = `PKR ${fmtVal(p10)} – ${fmtVal(p90)}`;
    const confidenceText = `with 80% confidence, your wealth will fall between ${confidenceRange}`;

    return `${modeText}, ${medianText}, ${riskLevel.text} ${riskLevel.emoji}. The simulation shows ${skewAnalysis.text} ${skewAnalysis.emoji}, and ${confidenceText}. Based on your current spending, you are saving enough to stay on this track.`;
  })();

  const probEntries = result?.probabilityMetrics
    ? Object.entries(result.probabilityMetrics)
    : [];
  const stratEntries = result?.strategyComparison
    ? Object.entries(result.strategyComparison)
    : [];

  const getStrategyIcon = (strategy) => {
    const icons = {
      CASH_ONLY: Shield,
      CONSERVATIVE: Shield,
      BALANCED: PieChart,
      AGGRESSIVE: Zap,
      FIXED_DEPOSIT: Clock,
    };
    return icons[strategy] || Activity;
  };

  const inConfidenceRange = (mid) => mid >= p10 && mid <= p90;

  const generatePaths = (baseTrajectory, count = 20) => {
    if (!baseTrajectory) return [];
    return Array.from({ length: count }, () => {
      let prev = baseTrajectory[0];
      return baseTrajectory.map((v, i) => {
        const noise = (Math.random() - 0.5) * v * 0.15;
        prev = Math.max(0, prev + noise);
        return { year: `Y${i}`, value: prev };  // FIXED: Years start from 0
      });
    });
  };

  const handleRunSimulation = () => {
    setShouldAnimate(true);
    sim.mutate();
  };

  if (isLoadingStrategy) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Loading your investment profile...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                  Financial Forecast{" "}
                  <span className="text-sm">(Simulation Engine)</span>
                </h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Monte Carlo simulation · {cfg.simulations.toLocaleString()}{" "}
                scenarios · inflation-adjusted
              </p>
            </div>
            {result && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating
                    PDF...
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    <Download size={14} /> Export Report
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
                <Calendar size={14} /> Years
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                type="number"
                min={1}
                max={30}
                value={cfg.years}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, years: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
                <Percent size={14} /> Inflation rate
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                type="number"
                step="0.01"
                min={0}
                max={1}
                value={cfg.inflationRate}
                onChange={(e) =>
                  setCfg((c) => ({
                    ...c,
                    inflationRate: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
                <Activity size={14} /> Simulations
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                value={cfg.simulations}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, simulations: Number(e.target.value) }))
                }
              >
                <option value={1000}>1,000 (fast)</option>
                <option value={10000}>10,000 (accurate)</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-all"
                onClick={handleRunSimulation}
                disabled={sim.isPending || !userId}
              >
                {sim.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Running
                    simulation...
                  </>
                ) : (
                  <>
                    <Cpu size={16} /> Run simulation
                  </>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              Investment Strategy{" "}
              <HelpCircle size={14} className="text-slate-400" />
            </label>
            <div className="flex flex-wrap gap-3">
              {STRATEGIES.map((s) => {
                const Icon = getStrategyIcon(s);
                const meta = STRATEGY_METADATA[s];
                const isActive = cfg.strategy === s;
                const isUserStrategy = userStrategy === s;
                return (
                  <StrategyTooltip key={s} strategy={s}>
                    <button
                      onClick={() => setCfg((c) => ({ ...c, strategy: s }))}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 relative ${isActive ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
                    >
                      <Icon size={14} /> {meta.name}
                      {isUserStrategy && !isActive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </button>
                  </StrategyTooltip>
                );
              })}
            </div>
            {userStrategy && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                ✓ Your default strategy (from dashboard profile) is{" "}
                {STRATEGY_METADATA[userStrategy]?.name}
              </p>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                    Returns Summary
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-dark-500 dark:text-slate-400 text-sm mb-1">
                      Nominal return
                    </p>
                    <p className="font-bold text-2xl text-indigo-600 dark:text-indigo-400">
                      {(result.nominalReturn * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-dark-500 dark:text-slate-400 text-sm mb-1">
                      Inflation impact
                    </p>
                    <p className="font-bold text-2xl text-amber-500">
                      −{(result.inflationRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-dark-500 dark:text-slate-400 text-sm mb-1">
                      Real return
                    </p>
                    <p
                      className={`font-bold text-2xl ${result.realReturn < 0 ? "text-red-500" : "text-green-600"}`}
                    >
                      {(result.realReturn * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div
                ref={lineChartRef}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                      Wealth Trajectory
                    </h2>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Account balance
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-orange-400" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Purchasing power
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Life Event (+)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Life Event (-)
                      </span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData}>
                    {showPaths &&
                      pathsData.map((path, idx) => (
                        <Line
                          key={idx}
                          data={path}
                          dataKey="value"
                          type="monotone"
                          stroke="#94a3b8"
                          strokeWidth={1}
                          dot={false}
                          isAnimationActive={true}
                          animationDuration={800}
                          opacity={0.3}
                        />
                      ))}
                    
                    {/* Life Event Reference Dots */}
                    {chartData.map((d, i) =>
                      d.event ? (
                        <ReferenceDot
                          key={i}
                          x={d.year}
                          y={d.nominal}
                          r={7}
                          fill={d.eventAmount >= 0 ? "#10b981" : "#ef4444"}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ) : null,
                    )}
                    
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tickFormatter={fmt}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    
                    {/* Tooltip with Nominal, Real, and Life Events */}
                    <Tooltip
                      formatter={(v) => `PKR ${fmtF(v)}`}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        
                        const data = payload[0]?.payload;
                        if (!data) return null;
                        
                        const nominalValue = data.nominal;
                        const realValue = data.real;
                        const isPositive = data.eventAmount >= 0;
                        const sign = isPositive ? "+" : "-";
                        
                        return (
                          <div
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.98)",
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              padding: "10px 14px",
                              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                              fontSize: "14px",
                              minWidth: "200px",
                            }}
                          >
                            <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                              Year {data.year.replace("Y", "")}
                            </p>
                            <div style={{ marginBottom: "6px" }}>
                              <span style={{ color: "#4F46E5", fontWeight: 500 }}>💰 Account balance:</span>
                              <span style={{ marginLeft: "8px", fontWeight: 600 }}>PKR {fmtF(nominalValue)}</span>
                            </div>
                            <div style={{ marginBottom: "6px" }}>
                              <span style={{ color: "#fb923c", fontWeight: 500 }}>📉 Purchasing power:</span>
                              <span style={{ marginLeft: "8px", fontWeight: 600 }}>PKR {fmtF(realValue)}</span>
                            </div>
                            {data.event && (
                              <div style={{ marginTop: "8px", paddingTop: "6px", borderTop: "1px solid #e2e8f0" }}>
                                <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "12px" }}>
                                  📌 {data.event}
                                </div>
                                <div style={{ color: isPositive ? "#10b981" : "#ef4444", fontSize: "11px" }}>
                                  {sign} PKR {fmtF(Math.abs(data.eventAmount))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nominal"
                      isAnimationActive={animateLine}
                      animationDuration={1400}
                      stroke="#4F46E5"
                      strokeWidth={3}
                      dot={false}
                      name="Account balance"
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="real"
                      isAnimationActive={animateLine}
                      animationDuration={1600}
                      stroke="#fb923c"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      dot={false}
                      name="Purchasing power"
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Life Events Legend */}
                {lifeEvents.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      📅 Life Events in Projection:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {lifeEvents.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              (event.lumpSumAmount || event.monthlyDelta || 0) >= 0
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="text-slate-600 dark:text-slate-400">
                            Year {event.atYear}: {event.eventName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    label: "Pessimistic (P10)",
                    val: result.p10,
                    color: "text-red-500",
                    icon: TrendingDown,
                    bgGradient:
                      "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20",
                    description: "Only 10% of simulations end below this value",
                  },
                  {
                    label: "Median (P50)",
                    val: result.p50,
                    color: "text-indigo-600",
                    icon: Target,
                    bgGradient:
                      "from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20",
                    description: "Middle outcome - 50% above, 50% below",
                  },
                  {
                    label: "Optimistic (P90)",
                    val: result.p90,
                    color: "text-green-600",
                    icon: TrendingUp,
                    bgGradient:
                      "from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20",
                    description: "Only 10% of simulations exceed this value",
                  },
                ].map(
                  ({
                    label,
                    val,
                    color,
                    icon: Icon,
                    bgGradient,
                    description,
                  }) => (
                    <div
                      key={label}
                      className={`bg-gradient-to-br ${bgGradient} rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-800`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                            {label}
                          </p>
                          <p className={`text-3xl font-bold ${color}`}>
                            PKR {fmt(val)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {description}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50">
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div
                ref={histRef}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                      Distribution of Outcomes
                    </h2>
                    {isAnimating && (
                      <div className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-xs text-indigo-600">
                        {barProgress < 1
                          ? "Building bars..."
                          : "Drawing curve..."}
                      </div>
                    )}
                  </div>
                  {lossProbability !== null && (
                    <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                      <Info size={12} className="text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        Risk profile:
                      </span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${lossProbability > 30 ? "text-red-500" : lossProbability > 10 ? "text-amber-500" : "text-green-500"}`}
                      >
                        {lossProbability > 30
                          ? "🔴 High"
                          : lossProbability > 10
                            ? "🟡 Moderate"
                            : "🟢 Low"}{" "}
                        downside risk
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Each bar shows how many simulations ended within a wealth
                  range.
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {" "}
                    Blue bars
                  </span>{" "}
                  show the 10th-90th percentile confidence range.
                  <span className="text-green-500"> Green curve</span> shows the
                  distribution shape.
                  {modeBucket && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {" "}
                      🟡 The most likely outcome (Mode) and Median (Middle) are
                      highlighted.
                    </span>
                  )}
                </p>
                {histData.length > 0 && (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={densityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      {modeBucket && (
                        <ReferenceLine
                          x={modeBucket.range}
                          stroke="#f59e0b"
                          strokeWidth={3}
                          label={{
                            value: "MODE (Most Likely)",
                            position: "top",
                            fill: "#f59e0b",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      {medianBucket &&
                        medianBucket.range !== modeBucket?.range && (
                          <ReferenceLine
                            x={medianBucket.range}
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{
                              value: "Median",
                              position: "bottom",
                              fill: "#f59e0b",
                              fontSize: 10,
                              fontWeight: 500,
                            }}
                          />
                        )}
                      <defs>
                        <linearGradient
                          id="barGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#6366F1"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor="#4F46E5"
                            stopOpacity={0.6}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        interval={Math.ceil(histData.length / 6)}
                        angle={-25}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis hide />
                      <Tooltip
                        labelFormatter={(label) => (
                          <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">
                            PKR {label}
                          </div>
                        )}
                        formatter={(value, name, props) => {
                          const { payload } = props;
                          if (!payload) return [null, null];
                          const count = payload.count || value;
                          const probability = (
                            (count / cfg.simulations) *
                            100
                          ).toFixed(1);
                          return [
                            <span
                              key="val"
                              className="font-medium text-indigo-600"
                            >
                              {count.toLocaleString()} ({probability}%)
                            </span>,
                            "Simulations",
                          ];
                        }}
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.98)",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          padding: "10px 14px",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="animatedCount"
                        isAnimationActive={false}
                        radius={[6, 6, 0, 0]}
                      >
                        {densityData.map((entry, index) => {
                          const isInRange = inConfidenceRange(entry.mid);
                          const isMode =
                            modeBucket && entry.range === modeBucket.range;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                isMode
                                  ? "#f59e0b"
                                  : isInRange
                                    ? "#4F46E5"
                                    : "#93c5fd"
                              }
                              fillOpacity={isMode ? 0.9 : isInRange ? 1 : 0.6}
                              stroke={isMode ? "#f59e0b" : "none"}
                              strokeWidth={isMode ? 1 : 0}
                            />
                          );
                        })}
                      </Bar>
                      <Line
                        type="monotone"
                        dataKey="animatedDensity"
                        isAnimationActive={false}
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        dot={false}
                        tooltipType="none"
                        name="Distribution curve"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-4 flex items-center justify-center gap-6 text-xs flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      10th-90th percentile (80% of outcomes)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-blue-300" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Extreme tails (10% each side)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Mode (Most likely outcome)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Distribution curve
                    </span>
                  </div>
                </div>
                {modeBucket && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Most Likely Outcome:
                      </span>
                      <span className="text-xs text-amber-600 dark:text-amber-300">
                        PKR {modeBucket.range} with{" "}
                        {((modeBucket.count / cfg.simulations) * 100).toFixed(
                          1,
                        )}
                        % probability
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {insight && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                        AI Financial Insight
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                    Goal Probability
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {probEntries.map(([target, prob], idx) => (
                    <div
                      key={target}
                      className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 text-center"
                    >
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        PKR {target}
                      </p>
                      <p
                        className={`text-2xl font-bold ${prob > 70 ? "text-green-600" : prob > 40 ? "text-amber-500" : "text-red-500"}`}
                      >
                        {prob}%
                      </p>
                      {prob > 70 && (
                        <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-2" />
                      )}
                      {prob < 30 && (
                        <AlertCircle className="w-4 h-4 text-red-500 mx-auto mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                      Strategy Comparison
                    </h2>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4">Strategy</th>
                        <th className="p-4 text-right">
                          Nominal ({cfg.years}yr)
                        </th>
                        <th className="p-4 text-right">Real ({cfg.years}yr)</th>
                        <th className="p-4 text-right">Expected Return</th>
                        <th className="p-4 text-right">Volatility</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stratEntries.map(([strat, val]) => {
                        const Icon = getStrategyIcon(strat);
                        const meta = STRATEGY_METADATA[strat];
                        const isUserStrategy = userStrategy === strat;
                        return (
                          <tr
                            key={strat}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isUserStrategy ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""}`}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Icon size={14} className="text-slate-400" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {meta?.name || strat.replaceAll("_", " ")}
                                </span>
                                {isUserStrategy && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    (Your Strategy)
                                  </span>
                                )}
                              </div>
                             </td>
                            <td className="p-4 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                              PKR {fmt(val)}
                             </td>
                            <td className="p-4 text-right text-orange-500">
                              PKR {fmt(result.realComparison?.[strat] ?? val)}
                             </td>
                            <td className="p-4 text-right">
                              <span
                                className={`font-medium ${meta?.color || "text-slate-600"}`}
                              >
                                {meta?.returns || "N/A"}
                              </span>
                             </td>
                            <td className="p-4 text-right text-slate-500">
                              ±{meta?.volatility || "N/A"}
                             </td>
                           </tr>
                        );
                      })}
                    </tbody>
                   </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}