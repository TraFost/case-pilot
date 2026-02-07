import { jsPDF } from "jspdf";

type SarReport = {
	subjectName: string;
	subjectId: string;
	riskScore: number;
	trigger: string;
	reportDate: string;
	narrative: string;
};

const loadLogoAsPng = async (src: string) => {
	return new Promise<string | null>((resolve) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext("2d");
			if (!context) {
				resolve(null);
				return;
			}
			context.drawImage(image, 0, 0);
			resolve(canvas.toDataURL("image/png"));
		};
		image.onerror = () => resolve(null);
		image.src = src;
	});
};

const writeLines = (
	doc: jsPDF,
	lines: string[],
	startY: number,
	pageHeight: number,
	margin: number,
	lineHeight: number,
) => {
	let y = startY;
	lines.forEach((line) => {
		if (y > pageHeight - margin) {
			doc.addPage();
			y = margin;
		}
		doc.text(line, margin, y);
		y += lineHeight;
	});
	return y;
};

export const buildSarPdf = async (report: SarReport, logoPath: string) => {
	const doc = new jsPDF({ unit: "pt", format: "a4" });
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 48;
	let cursorY = margin;

	const logoDataUrl = await loadLogoAsPng(logoPath);
	if (logoDataUrl) {
		doc.addImage(logoDataUrl, "PNG", margin, cursorY, 40, 40);
	}

	doc.setFont("helvetica", "bold");
	doc.setFontSize(14);
	cursorY += 56;
	doc.text(
		"CONFIDENTIAL - SUSPICIOUS ACTIVITY REPORT NARRATIVE",
		margin,
		cursorY,
	);
	cursorY += 24;

	doc.setFont("helvetica", "normal");
	doc.setFontSize(11);
	const detailLine = `Subject Name: ${report.subjectName}   Subject ID: ${report.subjectId}   Risk Score: ${report.riskScore}   Date of Report: ${report.reportDate}`;
	const detailLines = doc.splitTextToSize(detailLine, pageWidth - margin * 2);
	cursorY = writeLines(doc, detailLines, cursorY, pageHeight, margin, 14);
	cursorY += 8;

	doc.setFont("helvetica", "normal");
	doc.setFontSize(11);
	const narrativeLines = doc.splitTextToSize(
		report.narrative,
		pageWidth - margin * 2,
	);
	cursorY = writeLines(doc, narrativeLines, cursorY, pageHeight, margin, 14);

	if (logoDataUrl) {
		doc.addImage(logoDataUrl, "PNG", margin, pageHeight - margin - 28, 28, 28);
	}

	return doc.output("blob");
};

export type { SarReport };
