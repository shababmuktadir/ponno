import { useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FileText, Download, Printer, RefreshCw, BarChart3, Boxes,
  Users, Package, Wallet,
} from "lucide-react";

import { generateReport, saveReportLog } from "@/services/firebase/reportService";
import usePermission from "@/hooks/usePermission";
import useBranding from "@/hooks/useBranding";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { downloadElementAsPDF, printElement } from "@/utils/pdf/pdfGenerator";
import { toBanglaDate } from "@/utils/banglaDate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ReportTemplate from "@/components/pdf/ReportTemplate";
import UpgradePrompt from "@/components/package/UpgradePrompt";
import { cn } from "@/utils/cn";

const REPORT_TYPES = [
  { id: "sales", label: "বিক্রয় রিপোর্ট", icon: BarChart3 },
  { id: "income", label: "আয় রিপোর্ট", icon: Wallet },
  { id: "stock", label: "স্টক রিপোর্ট", icon: Boxes },
  { id: "product", label: "প্রোডাক্ট রিপোর্ট", icon: Package },
  { id: "customer", label: "কাস্টমার রিপোর্ট", icon: Users },
];

export default function Reports() {
  const { canPage } = usePermission();
  const branding = useBranding();
  const { workspaceId, uid } = useAuth();

  const pdfRef = useRef(null);

  const [type, setType] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageAllowed = canPage("report");

  const generate = async () => {
    if (!workspaceId) return toast.error("ওয়ার্কস্পেস নেই");
    setLoading(true);
    try {
      const r = await generateReport(workspaceId, { type, from, to });
      // attach period label
      r.period =
        from && to
          ? `${toBanglaDate(from)} — ${toBanglaDate(to)}`
          : "সম্পূর্ণ সময়কাল";
      setReport(r);
      await saveReportLog(workspaceId, uid, {
        reportType: type,
        filters: { from, to },
        generatedAt: new Date().toISOString(),
      });
      toast.success("রিপোর্ট তৈরি হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      if (!pdfRef.current) return;
      const name = `${type}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      await downloadElementAsPDF(pdfRef.current, name);
      toast.success("PDF ডাউনলোড হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const print = () => {
    try {
      printElement(pdfRef.current, "রিপোর্ট");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!pageAllowed) return <UpgradePrompt pageId="report" />;

  return (
    <div className="space-y-5 pb-10">
      <header className="no-print">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          রিপোর্ট
        </h1>
        <p className="mt-1 text-sm text-muted">
          পূর্ণাঙ্গ রিপোর্ট তৈরি, PDF ডাউনলোড ও প্রিন্ট
        </p>
      </header>

      <Card variant="glass" className="no-print p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">
          রিপোর্টের ধরন
        </h2>
        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => setType(r.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-xs transition-colors",
                  type === r.id
                    ? "border-accent-strong bg-accent/20 text-ink"
                    : "border-line bg-surface-2 text-muted hover:border-line-strong"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="শুরুর তারিখ"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="শেষ তারিখ"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={generate} loading={loading}>
            <FileText className="h-4 w-4" />
            রিপোর্ট তৈরি
          </Button>
          {report && (
            <>
              <Button variant="secondary" onClick={downloadPDF}>
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="secondary" onClick={print}>
                <Printer className="h-4 w-4" />
                প্রিন্ট
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* PREVIEW */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="w-full overflow-x-auto">
            <div className="min-w-[210mm] p-2">
              <ReportTemplate
                ref={pdfRef}
                report={report}
                branding={branding}
                reportType={type}
              />
            </div>
          </div>
        </motion.div>
      )}

      {!report && !loading && (
        <Card
          variant="glass"
          className="no-print p-12 text-center text-sm text-muted"
        >
          রিপোর্টের ধরন নির্বাচন করে "রিপোর্ট তৈরি" ক্লিক করুন
        </Card>
      )}
    </div>
  );
}