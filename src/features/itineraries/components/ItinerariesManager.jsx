import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import itinerariesService from '../services/itinerariesService'
import { formatDate } from '../../../utils/date'
import { useAuth } from '../../authentication/AuthProvider'

const STATUS_MAP = { 1: 'Draft', 2: 'Active', 3: 'Modified', 4: 'Completed', 5: 'Cancelled' }
const STATUS_OPTIONS = [1, 2, 3, 4, 5]
const EMPTY = { title: '', description: '', startDate: '', endDate: '' }

export default function ItinerariesManager() {
  const { currentUser } = useAuth()
  const isTraveler = currentUser?.role === 'Traveler'
  const [itins, setItins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editItin, setEditItin] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [preview, setPreview] = useState(null)
  const load = () => {
    setLoading(true)
    const params = isTraveler ? { userId: currentUser?.id } : {}
    itinerariesService.list(params)
      .then(setItins)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { 
    setEditItin(null)
    setForm(EMPTY)
    setShowModal(true) 
  }
  
  const openEdit = (i) => {
    setEditItin(i)
    setForm({ 
      title: i.title || '', 
      description: i.description || '', 
      startDate: String(i.startDate || '').slice(0, 10), 
      endDate: String(i.endDate || '').slice(0, 10) 
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      userId: currentUser?.id,
      title: form.title,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    }
    try {
      editItin ? await itinerariesService.update(editItin.itineraryId, payload) : await itinerariesService.create(payload)
      setShowModal(false)
      load()
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete itinerary?')) return
    try { 
      await itinerariesService.remove(id)
      load() 
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const handleStatus = async (id, statusInt) => {
    try {
      await itinerariesService.patchStatus(id, Number(statusInt))
      load()
    } catch (err) {
      alert(err?.response?.data?.message || err.message)
    }
  }

  const handleExport = (itin) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    let y = 50

    doc.setFillColor(0, 188, 212)
    doc.rect(0, 0, W, 80, 'F')
    doc.setFillColor(255, 255, 255)
    doc.circle(55, 40, 22, 'F')
    doc.setTextColor(0, 188, 212)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('TE', 47, 44)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text('TravelEase', 90, 35)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Travel Planning System', 90, 52)
    doc.text('support@travelease.com  |  www.travelease.com', 90, 65)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text('ITINERARY', W - 40, 48, { align: 'right' })

    y = 110
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)

    const fields = [
      ['Itinerary ID', `#${itin.itineraryId}`],
      ['Title', itin.title || '-'],
      ['Start Date', formatDate(itin.startDate)],
      ['End Date', formatDate(itin.endDate)],
      ['Status', STATUS_MAP[itin.status] || itin.status],
      ['Created', formatDate(itin.createdDate)],
    ]
    fields.forEach(([label, value], idx) => {
      const col = idx % 2 === 0 ? 50 : W / 2 + 20
      if (idx % 2 === 0 && idx > 0) y += 28
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 188, 212)
      doc.text(label, col, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 50)
      doc.text(String(value), col, y + 14)
    })

    y += 50
    doc.setDrawColor(0, 188, 212)
    doc.setLineWidth(1.5)
    doc.line(50, y, W - 50, y)
    y += 20

    doc.setFillColor(0, 188, 212)
    doc.rect(0, doc.internal.pageSize.getHeight() - 30, W, 30, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text('TravelEase — Simplifying Travel Management', W / 2, doc.internal.pageSize.getHeight() - 12, { align: 'center' })

    doc.save(`itinerary-${itin.itineraryId}.pdf`)
  }

  const statusBadge = (s) => {
    const label = STATUS_MAP[s] || s
    const map = { Active: 'bg-success', Draft: 'bg-warning text-dark', Modified: 'bg-secondary', Completed: 'bg-info', Cancelled: 'bg-danger' }
    return <span className={`badge ${map[label] || 'bg-secondary'}`}>{label}</span>
  }

  if (loading) return <div className="text-center py-4"><div className="spinner-border" /></div>
  if (error) return <div className="alert alert-danger">{error}</div>

  return (
    <div>
      {preview && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content bg-dark border-secondary rounded-0">
              <div className="modal-header border-secondary" style={{ background: '#00bcd4' }}>
                <h6 className="modal-title text-dark font-monospace text-uppercase fw-bold">
                  <i className="fa-solid fa-map me-2" />Itinerary Preview
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body">
                {[['Itinerary ID', `#${preview.itineraryId}`], ['Title', preview.title || '-'], ['Start Date', formatDate(preview.startDate)], ['End Date', formatDate(preview.endDate)], ['Status', STATUS_MAP[preview.status] || preview.status], ['Created', formatDate(preview.createdDate)]].map(([label, val]) => (
                  <div key={label} className="mb-3">
                    <div className="text-info font-monospace text-uppercase small fw-bold mb-1">{label}</div>
                    <div className="text-light" style={{ lineHeight: 1.7 }}>{val}</div>
                    <hr className="border-secondary mt-2" />
                  </div>
                ))}
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-outline-secondary btn-sm rounded-0 font-monospace" onClick={() => setPreview(null)}>Close</button>
                <button className="btn btn-info btn-sm rounded-0 font-monospace text-dark" onClick={() => { handleExport(preview); setPreview(null) }}>
                  <i className="fa-solid fa-download me-1" />Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-secondary bg-opacity-10 border-secondary rounded-0">
        <div>
          <h5 className="text-white font-monospace text-uppercase mb-1">Itineraries</h5>
          <small className="text-light font-monospace">Travel Planning System</small>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
          <button className="btn btn-outline-info btn-sm rounded-0 font-monospace text-uppercase" onClick={openCreate}>
            <i className="fa-solid fa-plus me-2" />New Itinerary
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle rounded-0 border-secondary">
          <thead className="bg-info text-dark">
            <tr>
              <th className="font-monospace text-uppercase small border-secondary">Title</th>
              <th className="font-monospace text-uppercase small border-secondary">Start</th>
              <th className="font-monospace text-uppercase small border-secondary">End</th>
              <th className="font-monospace text-uppercase small border-secondary">Status</th>
              {!isTraveler && <th className="font-monospace text-uppercase small border-secondary">Change Status</th>}
              <th className="font-monospace text-uppercase small border-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {itins.map(i => (
              <React.Fragment key={i.itineraryId}>
                <tr className="border-secondary bg-dark">
                  <td className="text-secondary font-monospace border-secondary bg-darker">{i.title || i.itineraryId}</td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(i.startDate)}</td>
                  <td className="text-secondary font-monospace border-secondary bg-darker">{formatDate(i.endDate)}</td>
                  <td className="border-secondary bg-darker">{statusBadge(i.status)}</td>
                  {!isTraveler && (
                    <td className="border-secondary bg-darker">
                      <select className="form-select form-select-sm bg-dark text-white border-secondary rounded-0" style={{ width: 130 }} value={i.status}
                        onChange={e => handleStatus(i.itineraryId, e.target.value)}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-dark text-white">{STATUS_MAP[s]}</option>)}
                      </select>
                    </td>
                  )}
                  <td className="border-secondary bg-darker">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary rounded-0" title="Preview & Export PDF" onClick={() => setPreview(i)}><i className="fa-solid fa-file-pdf" /></button>
                      <button className="btn btn-outline-info rounded-0" onClick={() => openEdit(i)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-outline-danger rounded-0" onClick={() => handleDelete(i.itineraryId)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
            {itins.length === 0 && (
              <tr>
                <td colSpan={isTraveler ? 5 : 6} className="text-center text-light border-secondary bg-secondary bg-opacity-25">
                  <i className="fa-solid fa-map me-2"></i>
                  <span className="font-monospace">No itineraries found in system registry.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.8)' }}>
          <div className="modal-dialog">
            <form className="modal-content bg-secondary bg-opacity-10 border-secondary rounded-0" onSubmit={handleSubmit}>
              <div className="modal-header bg-dark border-secondary">
                <div>
                  <h5 className="text-white font-monospace text-uppercase mb-1">{editItin ? 'Edit Itinerary' : 'New Itinerary'}</h5>
                  <small className="text-light font-monospace">Travel Planning System</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-info" role="status"></div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>
              </div>
              <div className="modal-body bg-dark">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Title</label>
                    <input className="form-control bg-dark text-white border-secondary rounded-0" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Description</label>
                    <textarea className="form-control bg-dark text-white border-secondary rounded-0" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">Start Date</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-white font-monospace text-uppercase small">End Date</label>
                    <input type="date" className="form-control bg-dark text-white border-secondary rounded-0" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-outline-secondary rounded-0 font-monospace text-uppercase" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-outline-info rounded-0 font-monospace text-uppercase">
                  <i className="fa-solid fa-save me-2"></i>Save Itinerary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}