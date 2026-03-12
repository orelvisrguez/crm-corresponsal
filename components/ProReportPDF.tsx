'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Register fonts for a more professional look
// Note: In a real app, you might bundle these or use standard ones
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica-bold@1.0.4/Helvetica-Bold.ttf'
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginRight: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    letterSpacing: 1,
  },
  companySub: {
    fontSize: 8,
    color: '#2563eb',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  confidential: {
    textAlign: 'right',
  },
  confidentialLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  confidentialValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0f172a',
  },
  section: {
    marginBottom: 15,
  },
  heading2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flexDirection: 'column',
  },
  footerLine: {
    width: 100,
    height: 1,
    backgroundColor: '#94a3b8',
    marginBottom: 5,
  },
  footerLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  footerSub: {
    fontSize: 7,
    color: '#64748b',
  },
  date: {
    textAlign: 'right',
  },
  dateLabel: {
    fontSize: 7,
    color: '#64748b',
  },
  dateValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Simple Table Styles
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f8fafc',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 8,
  }
})

interface Props {
  title: string
  content: string
}

export const ProReportPDF = ({ title, content }: Props) => {
  // Simple markdown parser for the PDF
  const lines = content.split('\n')
  
  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle} />
            <View>
              <Text style={styles.companyName}>ASSISTRAVEL</Text>
              <Text style={styles.companySub}>Global Case Management</Text>
            </View>
          </View>
          <View style={styles.confidential}>
            <Text style={styles.confidentialLabel}>Clasificación</Text>
            <Text style={styles.confidentialValue}>Estrictamente Confidencial</Text>
          </View>
        </View>

        {/* Content */}
        <View>
          <Text style={styles.title}>{title.split(' - ')[0]}</Text>
          
          {lines.map((line, i) => {
            if (line.startsWith('# ')) {
              return null // Skip main title as we use the prop
            }
            if (line.startsWith('## ')) {
              return <Text key={i} style={styles.heading2}>{line.replace('## ', '')}</Text>
            }
            if (line.startsWith('### ')) {
              return <Text key={i} style={{ fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5 }}>{line.replace('### ', '')}</Text>
            }
            if (line.startsWith('> ')) {
              return (
                <View key={i} style={{ borderLeft: 2, borderLeftColor: '#2563eb', backgroundColor: '#f0f9ff', padding: 10, marginVertical: 10 }}>
                  <Text style={{ fontStyle: 'italic', fontSize: 9 }}>{line.replace('> ', '')}</Text>
                </View>
              )
            }
            if (line.trim() === '') return <View key={i} style={{ height: 10 }} />
            
            // Handle simple bold text
            return (
              <Text key={i} style={styles.paragraph}>
                {line.replace(/\*\*/g, '')}
              </Text>
            )
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.footerLine} />
            <Text style={styles.footerLabel}>Dirección de Operaciones</Text>
            <Text style={styles.footerSub}>Assistravel Corporate System v3.0</Text>
          </View>
          <View style={styles.date}>
            <Text style={styles.dateLabel}>Fecha de Emisión</Text>
            <Text style={styles.dateValue}>{new Date().toLocaleDateString('es-AR', { dateStyle: 'long' })}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
