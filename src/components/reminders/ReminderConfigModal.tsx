import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { useSettings } from '../../hooks/useSettings'
import type { Student } from '../../types'

interface ReminderConfigModalProps {
  isOpen: boolean
  onClose: () => void
  students: Student[]
  onContinue: (config: {
    type: 'fees' | 'competition' | 'manual'
    customAmount?: number
    customMessage: string
  }) => void
}

export function ReminderConfigModal({ isOpen, onClose, students, onContinue }: ReminderConfigModalProps) {
  const { competitionFee, manualFee, manualTemplate } = useSettings()
  
  const [reminderType, setReminderType] = useState<'fees' | 'competition' | 'manual'>('fees')
  const [customFeeInput, setCustomFeeInput] = useState('')
  const [manualMessage, setManualMessage] = useState(manualTemplate)

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setReminderType('fees')
      setCustomFeeInput('')
      setManualMessage(manualTemplate)
    }
  }, [isOpen, manualTemplate])

  const handleContinue = () => {
    let finalAmount: number | undefined = undefined
    if (customFeeInput) {
      finalAmount = Number(customFeeInput)
    } else {
      if (reminderType === 'competition') finalAmount = competitionFee
      else if (reminderType === 'manual') finalAmount = manualFee
    }
    
    onContinue({
      type: reminderType,
      customAmount: finalAmount,
      customMessage: manualMessage
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Configure Reminder (${students.length} student${students.length !== 1 ? 's' : ''})`}>
      <div className="space-y-4">
        <div>
          <label className="form-label">Reminder Type</label>
          <select
            className="form-select"
            value={reminderType}
            onChange={e => {
              const type = e.target.value as any;
              setReminderType(type);
              if (type === 'competition') setCustomFeeInput(String(competitionFee || ''));
              else if (type === 'manual') setCustomFeeInput(String(manualFee || ''));
              else setCustomFeeInput('');
            }}
          >
            <option value="fees">Fees (Default Template)</option>
            <option value="competition">Competition</option>
            <option value="manual">Manual Entry</option>
          </select>
        </div>

        <div>
          <label className="form-label">
            Fee Amount for this Reminder (₹) {reminderType === 'fees' && '(Optional)'}
          </label>
          <input
            type="number"
            className="form-input"
            value={customFeeInput}
            onChange={e => setCustomFeeInput(e.target.value)}
            placeholder={
              reminderType === 'competition' ? `Default is ${competitionFee}` :
              reminderType === 'manual' ? `Default is ${manualFee}` :
              "Leave blank to use each student's normal fee"
            }
          />
          {reminderType === 'fees' && (
            <p className="text-xs text-gray-400 mt-1">If left blank, each student's specific monthly fee will be used safely.</p>
          )}
        </div>

        {reminderType === 'manual' && (
          <div>
            <label className="form-label">Custom Message</label>
            <textarea
              className="form-input h-32 resize-none"
              value={manualMessage}
              onChange={e => setManualMessage(e.target.value)}
              placeholder="Enter your custom message here..."
            />
            <p className="text-xs text-gray-400 mt-1">
              Supports: {'{{student_name}}'}, {'{{parent_name}}'}, {'{{amount}}'}, {'{{month}}'}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button 
            onClick={handleContinue}
            className="btn-primary flex-1"
          >
            Continue
          </button>
        </div>
      </div>
    </Modal>
  )
}
