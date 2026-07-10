import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import itinerariesService from '../services/itinerariesService'
import { formatDate } from '../../../utils/date'
import { useAuth } from '../../authentication/AuthProvider'

const STATUS_MAP = { 1: 'Draft', 2: 'Active', 3: 'Modified', 4: 'Completed', 5: 'Cancelled' }
const STATUSOPTIONS = [1, 2, 3, 4, 5]
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
      .then(data => setItins(Array.isArray(data) ? data : []))
      .catch(e => setError(e?.response?.data?.message || e.message))
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
      description: form.description,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    }
    try {
      if (editItin) {
        await itinerariesService.update(editItin.itineraryId, payload)
      } else {
        await itinerariesService.create(payload)
      }
      setShowModal(false)
      load()
    } catch (err) { 
      alert(err?.response?.data?.message || err.message) 
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this itinerary?')) return
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
    const map = { 
      Active: 'bg-success bg-opacity-10 text-success', 
      Draft: 'bg-warning bg-opacity-10 text-warning', 
      Modified: 'bg-secondary bg-opacity-10 text-secondary', 
      Completed: 'bg-info bg-opacity-10 text-info', 
      Cancelled: 'bg-danger bg-opacity-10 text-danger' 
    }
    return <span className={`badge rounded-pill px-3 ${map[label] || 'bg-secondary text-white'}`}>{label}</span>
  }

  if (error) return <div className="alert alert-danger m-4">{error}</div>

  return (
    <div className="container-fluid py-4">
      
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: '-0.5px' }}>
            Itineraries
          </h2>
          <p className="text-muted mb-0 small">Travel Planning System and Resource Registry</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-primary btn-sm text-white" 
            style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
            onClick={openCreate}
          >
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            New Itinerary
          </button>
        </div>
      </div>

      {/* Main Table Content / Loading */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#6f42c1' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="small fw-bold text-secondary text-uppercase ps-4">Title</th>
                  <th className="small fw-bold text-secondary text-uppercase">Start Date</th>
                  <th className="small fw-bold text-secondary text-uppercase">End Date</th>
                  <th className="small fw-bold text-secondary text-uppercase">Status</th>
                  {!isTraveler && <th className="small fw-bold text-secondary text-uppercase">Change Status</th>}
                  <th className="small fw-bold text-secondary text-uppercase text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {itins.map(i => (
                  <tr key={i.itineraryId}>
                    <td className="ps-4 fw-semibold text-dark">{i.title || `Itinerary #${i.itineraryId}`}</td>
                    <td className="text-muted">{formatDate(i.startDate)}</td>
                    <td className="text-muted">{formatDate(i.endDate)}</td>
                    <td>{statusBadge(i.status)}</td>
                    {!isTraveler && (
                      <td>
                        <select 
                          className="form-select form-select-sm border-secondary shadow-sm" 
                          style={{ maxWidth: '130px' }}
                          value={i.status} 
                          onChange={e => handleStatus(i.itineraryId, e.target.value)}
                        >
                          {STATUSOPTIONS.map(s => (
                            <option key={s} value={s}>{STATUS_MAP[s]}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end">
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          style={{ borderColor: '#6f42c1', color: '#6f42c1' }}
                          onClick={() => setPreview(i)}
                          title="Preview Itinerary"
                        >
                          <i className="bi bi-eye" />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success" 
                          onClick={() => openEdit(i)}
                          title="Edit Itinerary"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(i.itineraryId)}
                          title="Delete Itinerary"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {itins.length === 0 && (
                  <tr>
                    <td colSpan={isTraveler ? 5 : 6} className="text-center py-5 text-muted bg-light bg-opacity-50">
                      <i className="bi bi-journal-x me-2 fs-4 d-block mb-2 text-secondary"></i>
                      <span>No itineraries found in system registry.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics Blocks */}
      <div className="row mt-5">
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 style={{ color: '#6f42c1' }}>{itins.length}</h3>
              <small className="text-muted">Total Registered Itineraries</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-success">{itins.filter(i => i.status === 2).length}</h3>
              <small className="text-muted">Active Plans</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-danger">{itins.filter(i => i.status === 5).length}</h3>
              <small className="text-muted">Cancelled Plans</small>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog Modal */}
      {preview && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header text-white" style={{ backgroundColor: '#6f42c1' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-eye-fill me-2"></i>Itinerary Preview
                </h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body p-4">
                <div className="d-flex flex-column gap-3">
                  {[
                    ['Itinerary ID', `#${preview.itineraryId}`],
                    ['Title', preview.title || '-'],
                    ['Description', preview.description || '-'],
                    ['Start Date', formatDate(preview.startDate)],
                    ['End Date', formatDate(preview.endDate)],
                    ['Status', STATUS_MAP[preview.status] || preview.status],
                    ['Created', formatDate(preview.createdDate)]
                  ].map(([label, val]) => (
                    <div key={label} className="border-bottom pb-2">
                      <label className="form-label text-muted small fw-bold text-uppercase mb-0">{label}</label>
                      <div className="text-dark fw-semibold">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setPreview(null)}>Close</button>
                <button 
                  type="button" 
                  className="btn btn-primary text-white" 
                  style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
                  onClick={() => { handleExport(preview); setPreview(null); }}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Creation/Editing Form Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <form className="modal-content border-0 shadow-lg" onSubmit={handleSubmit}>
              <div className="modal-header text-white" style={{ backgroundColor: '#6f42c1' }}>
                <div>
                  <h5 className="modal-title fw-bold">
                    <i className={`bi ${editItin ? 'bi-pencil-square' : 'bi-plus-circle-fill'} me-2`}></i>
                    {editItin ? 'Edit Itinerary' : 'New Itinerary'}
                  </h5>
                </div>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Title</label>
                    <input className="form-control" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Description</label>
                    <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Start Date</label>
                    <input type="date" className="form-control" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">End Date</label>
                    <input type="date" className="form-control" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary text-white" style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}>
                  <i className="bi bi-save me-2"></i>Save Itinerary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}