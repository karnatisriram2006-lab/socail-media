import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function AnimatedCounter({ value, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value !== prevValue.current) {
      setDisplayValue(value)
      prevValue.current = value
    }
  }, [value])

  return (
    <motion.span
      key={displayValue}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={className}
    >
      {displayValue}
    </motion.span>
  )
}
