"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { X, Clock } from 'lucide-react'

interface Reminder {
  id: string
  message: string
  interval: number
  nextNotification: number
}

export default function EnhancedReminderApp() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [message, setMessage] = useState('')
  const [intervalValue, setIntervalValue] = useState('1')
  const [intervalUnit, setIntervalUnit] = useState('days')
  const [customTime, setCustomTime] = useState('')

  useEffect(() => {
    const storedReminders = localStorage.getItem('reminders')
    if (storedReminders) {
      setReminders(JSON.parse(storedReminders))
    }

    if ('Notification' in window) {
      Notification.requestPermission()
    }

    const checkInterval = setInterval(checkNotifications, 60000)
    return () => clearInterval(checkInterval)
  }, [])

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders))
  }, [reminders])

  const addReminder = () => {
    if (message && intervalValue && intervalUnit) {
      const intervalInMs = calculateIntervalInMs(parseInt(intervalValue), intervalUnit)
      const nextNotification = calculateNextNotification(intervalInMs)

      const newReminder: Reminder = {
        id: Date.now().toString(),
        message,
        interval: intervalInMs,
        nextNotification
      }
      setReminders([...reminders, newReminder])
      setMessage('')
      setIntervalValue('1')
      setIntervalUnit('days')
      setCustomTime('')
      toast.success('Reminder added successfully!')
    } else {
      toast.error('Please fill in all fields')
    }
  }

  const calculateIntervalInMs = (value: number, unit: string) => {
    const msPerUnit = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000
    }
    return value * msPerUnit[unit as keyof typeof msPerUnit]
  }

  const calculateNextNotification = (intervalInMs: number) => {
    if (customTime) {
      const [hours, minutes] = customTime.split(':').map(Number)
      const nextDate = new Date()
      nextDate.setHours(hours, minutes, 0, 0)
      if (nextDate.getTime() <= Date.now()) {
        nextDate.setTime(nextDate.getTime() + intervalInMs)
      }
      return nextDate.getTime()
    }
    return Date.now() + intervalInMs
  }

  const checkNotifications = () => {
    const now = Date.now()
    const updatedReminders = reminders.map(reminder => {
      if (reminder.nextNotification <= now) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Reminder', { body: reminder.message })
        }
        return {
          ...reminder,
          nextNotification: now + reminder.interval
        }
      }
      return reminder
    })
    setReminders(updatedReminders)
  }

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(reminder => reminder.id !== id))
    toast.info('Reminder deleted')
  }

  const formatNextNotification = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Enhanced Reminder App</h1>
      <div className="space-y-4">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter reminder message"
          aria-label="Reminder message"
        />
        <div className="flex space-x-2">
          <Input
            type="number"
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value)}
            placeholder="Interval"
            className="w-1/3"
            min="1"
            aria-label="Interval value"
          />
          <Select value={intervalUnit} onValueChange={setIntervalUnit}>
            <SelectTrigger className="w-1/3">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="w-1/3"
            aria-label="Custom time"
          />
        </div>
        <Button onClick={addReminder} className="w-full">Add Reminder</Button>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Current Reminders</h2>
        <ul className="space-y-2">
          {reminders.map(reminder => (
            <li key={reminder.id} className="bg-gray-100 p-2 rounded flex justify-between items-center">
              <div>
                <p>{reminder.message}</p>
                <p className="text-sm text-gray-500">
                  <Clock className="inline-block mr-1 w-4 h-4" />
                  Next: {formatNextNotification(reminder.nextNotification)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteReminder(reminder.id)}
                aria-label="Delete reminder"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <ToastContainer />
    </div>
  )
}