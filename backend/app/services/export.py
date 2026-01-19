"""
Export service for generating CSV and PDF reports
"""
import csv
import io
from datetime import datetime
from typing import List, Dict
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER


def generate_csv_report(biometrics: List[Dict], user_name: str) -> str:
    """
    Generate CSV report from biometric data
    Returns CSV content as string
    """
    output = io.StringIO()
    
    if not biometrics:
        writer = csv.writer(output)
        writer.writerow(['No data available'])
        return output.getvalue()
    
    # Determine all unique fields from the biometric data
    fieldnames = ['timestamp']
    for entry in biometrics:
        for key in entry.keys():
            if key not in ['_id', 'user_id'] and key not in fieldnames:
                fieldnames.append(key)
    
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    for entry in biometrics:
        # Format timestamp
        row_data = {'timestamp': entry.get('timestamp', '')}
        
        # Add all other fields
        for field in fieldnames:
            if field == 'timestamp':
                continue
            
            value = entry.get(field)
            
            # Handle blood pressure dict
            if field == 'blood_pressure' and isinstance(value, dict):
                row_data[field] = f"{value.get('systolic', '')}/{value.get('diastolic', '')}"
            elif value is not None:
                row_data[field] = value
            else:
                row_data[field] = ''
        
        writer.writerow(row_data)
    
    return output.getvalue()


def generate_pdf_report(biometrics: List[Dict], user_name: str, from_date: str = None, to_date: str = None) -> bytes:
    """
    Generate PDF report from biometric data
    Returns PDF content as bytes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#667eea'),
        alignment=TA_CENTER,
        spaceAfter=30,
    )
    
    # Add title
    title = Paragraph("Healio Health Report", title_style)
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    # Add user info and date range
    info_style = styles['Normal']
    user_info = Paragraph(f"<b>Patient:</b> {user_name}", info_style)
    elements.append(user_info)
    elements.append(Spacer(1, 6))
    
    if from_date and to_date:
        date_range = Paragraph(f"<b>Period:</b> {from_date} to {to_date}", info_style)
    elif from_date:
        date_range = Paragraph(f"<b>From:</b> {from_date}", info_style)
    elif to_date:
        date_range = Paragraph(f"<b>To:</b> {to_date}", info_style)
    else:
        date_range = Paragraph(f"<b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", info_style)
    
    elements.append(date_range)
    elements.append(Spacer(1, 20))
    
    if not biometrics:
        no_data = Paragraph("<i>No biometric data available for the selected period.</i>", info_style)
        elements.append(no_data)
    else:
        # Create table data
        table_data = [['Date & Time', 'Metric', 'Value', 'Unit']]
        
        for entry in biometrics:
            timestamp = entry.get('timestamp', 'N/A')
            if isinstance(timestamp, datetime):
                timestamp_str = timestamp.strftime('%Y-%m-%d %H:%M')
            else:
                timestamp_str = str(timestamp)[:16] if timestamp else 'N/A'
            
            # Handle new data structure with metric/value/unit
            metric = entry.get('metric', '')
            value = entry.get('value', '')
            unit = entry.get('unit', '')
            
            if metric and value is not None:
                metric_name = metric.replace('_', ' ').title()
                table_data.append([timestamp_str, metric_name, str(value), unit])
        
        # Create table
        table = Table(table_data, colWidths=[2.2*inch, 1.5*inch, 1.2*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 20))
        
        # Add summary statistics
        summary_title = Paragraph("<b>Summary Statistics</b>", styles['Heading2'])
        elements.append(summary_title)
        elements.append(Spacer(1, 12))
        
        # Calculate averages from new data structure
        metrics_to_summarize = {}
        for entry in biometrics:
            metric = entry.get('metric')
            value = entry.get('value')
            if metric and value is not None:
                if metric not in metrics_to_summarize:
                    metrics_to_summarize[metric] = []
                metrics_to_summarize[metric].append(value)
        
        summary_data = [['Metric', 'Average', 'Min', 'Max', 'Count']]
        
        for metric, values in metrics_to_summarize.items():
            if values:
                avg = sum(values) / len(values)
                min_val = min(values)
                max_val = max(values)
                count = len(values)
                
                metric_name = metric.replace('_', ' ').title()
                summary_data.append([
                    metric_name,
                    f"{avg:.1f}",
                    str(min_val),
                    str(max_val),
                    str(count)
                ])
        
        if len(summary_data) > 1:
            summary_table = Table(summary_data, colWidths=[1.8*inch, 1.2*inch, 1*inch, 1*inch, 1*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            
            elements.append(summary_table)
    
    # Add footer
    elements.append(Spacer(1, 30))
    footer = Paragraph(
        "<i>This report is generated by Healio Virtual Health Companion. "
        "For medical advice, please consult with your healthcare provider.</i>",
        styles['Normal']
    )
    elements.append(footer)
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF content
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content
