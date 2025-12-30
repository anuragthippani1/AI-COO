'use client'

export default function AIPreviewModal({ isOpen, onClose, preview, onApprove, onReject }) {
  if (!isOpen) return null

  const {
    previewText = '',
    explanation = '',
    confidence = 0,
    risk = 'medium',
    actionType = '',
  } = preview || {}

  const riskLabel = risk ? risk.charAt(0).toUpperCase() + risk.slice(1) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900">AI Action Preview</h2>
            {actionType && (
              <p className="text-xs text-gray-500 mt-0.5">Action type: {actionType}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-900 text-white">
              Confidence: {confidence}/100
            </span>
            {risk && (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${
                  risk === 'low'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : risk === 'high'
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}
              >
                {riskLabel} risk
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              What the AI will do
            </h3>
            <p className="text-sm text-gray-800 whitespace-pre-line">{previewText}</p>
          </div>

          {explanation && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Why the AI chose this
              </h3>
              <p className="text-xs text-gray-700 whitespace-pre-line">{explanation}</p>
            </div>
          )}

          <div className="rounded-lg border border-dashed border-gray-200 p-3 bg-gray-50">
            <p className="text-[11px] text-gray-500">
              TODO: Wire these buttons to{' '}
              <span className="font-mono">/api/ai/approve</span> and{' '}
              <span className="font-mono">/api/ai/reject</span> with a real{' '}
              <span className="font-mono">approvalRequestId</span> from the backend.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex flex-col md:flex-row gap-2 md:gap-3 justify-end">
          <button
            onClick={onReject}
            className="inline-flex justify-center items-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            Approve &amp; Run
          </button>
        </div>
      </div>
    </div>
  )
}









