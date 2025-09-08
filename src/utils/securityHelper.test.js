import {
  sanitizeHtml,
  sanitizeFieldValue,
  sanitizeFieldName,
  escapeHtml,
  sanitizeStacProperties,
  isDangerousHtml,
  validateFieldSecurity
} from './securityHelper.js'

describe('securityHelper', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous script tags', () => {
      const malicious = '<script>alert("XSS")</script>Hello'
      const result = sanitizeHtml(malicious)
      expect(result).toBe('Hello')
    })

    it('should remove event handlers', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')">'
      const result = sanitizeHtml(malicious)
      // DOMPurify removes the entire img tag when it contains dangerous attributes
      expect(result).toBe('')
    })

    it('should allow safe HTML tags', () => {
      const safe = '<br/><strong>Bold</strong><em>Italic</em>'
      const result = sanitizeHtml(safe)
      expect(result).toBe('<br><strong>Bold</strong><em>Italic</em>')
    })

    it('should handle strict mode', () => {
      const html = '<br/><strong>Bold</strong>'
      const result = sanitizeHtml(html, true)
      expect(result).toBe('Bold')
    })

    it('should handle non-string inputs', () => {
      expect(sanitizeHtml(null)).toBe('')
      expect(sanitizeHtml(undefined)).toBe('')
      expect(sanitizeHtml(123)).toBe('123')
    })
  })

  describe('sanitizeFieldValue', () => {
    it('should sanitize string values', () => {
      const malicious = '<script>alert("XSS")</script>'
      const result = sanitizeFieldValue(malicious)
      expect(result).toBe('')
    })

    it('should handle boolean values', () => {
      expect(sanitizeFieldValue(true)).toBe('Yes')
      expect(sanitizeFieldValue(false)).toBe('No')
    })

    it('should handle numeric values', () => {
      expect(sanitizeFieldValue(123)).toBe('123')
      expect(sanitizeFieldValue(45.67)).toBe('45.67')
    })

    it('should handle array values', () => {
      const array = ['<script>alert("XSS")</script>', 'safe', 123]
      const result = sanitizeFieldValue(array)
      expect(result).toBe(', safe, 123')
    })

    it('should handle object values', () => {
      const obj = { name: '<script>alert("XSS")</script>', value: 123 }
      const result = sanitizeFieldValue(obj)
      expect(result).toBe('{name: , value: 123}')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeFieldValue(null)).toBe('')
      expect(sanitizeFieldValue(undefined)).toBe('')
    })
  })

  describe('sanitizeFieldName', () => {
    it('should sanitize field names with special characters', () => {
      expect(sanitizeFieldName('field:name')).toBe('field-name')
      expect(sanitizeFieldName('field.name')).toBe('field-name')
      expect(sanitizeFieldName('field name')).toBe('field-name')
    })

    it('should preserve safe characters', () => {
      expect(sanitizeFieldName('field_name')).toBe('field_name')
      expect(sanitizeFieldName('field-name')).toBe('field-name')
      expect(sanitizeFieldName('field123')).toBe('field123')
    })

    it('should handle non-string inputs', () => {
      expect(sanitizeFieldName(null)).toBe('unknown-field')
      expect(sanitizeFieldName(123)).toBe('unknown-field')
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert("XSS")&lt;/script&gt;'
      )
      expect(escapeHtml('Hello & World')).toBe('Hello &amp; World')
    })

    it('should handle non-string inputs', () => {
      expect(escapeHtml(null)).toBe('')
      expect(escapeHtml(123)).toBe('123')
    })
  })

  describe('sanitizeStacProperties', () => {
    it('should sanitize all properties', () => {
      const properties = {
        'safe:field': 'safe value',
        'dangerous<script>': '<script>alert("XSS")</script>',
        normal_field: 123
      }

      const result = sanitizeStacProperties(properties)

      expect(result['safe-field']).toBe('safe value')
      expect(result['dangerous-script-']).toBe('')
      expect(result.normal_field).toBe('123')
    })

    it('should handle empty or invalid input', () => {
      expect(sanitizeStacProperties(null)).toEqual({})
      expect(sanitizeStacProperties(undefined)).toEqual({})
      expect(sanitizeStacProperties('invalid')).toEqual({})
    })
  })

  describe('isDangerousHtml', () => {
    it('should detect dangerous patterns', () => {
      expect(isDangerousHtml('<script>alert("XSS")</script>')).toBe(true)
      expect(isDangerousHtml('<img onerror="alert(\'XSS\')">')).toBe(true)
      expect(isDangerousHtml('javascript:alert("XSS")')).toBe(true)
      expect(isDangerousHtml('<iframe src="evil.com">')).toBe(true)
    })

    it('should allow safe content', () => {
      expect(isDangerousHtml('<br/><strong>Bold</strong>')).toBe(false)
      expect(isDangerousHtml('Plain text')).toBe(false)
      expect(isDangerousHtml('<span class="safe">Safe</span>')).toBe(false)
    })

    it('should handle non-string inputs', () => {
      expect(isDangerousHtml(null)).toBe(false)
      expect(isDangerousHtml(123)).toBe(false)
    })
  })

  describe('validateFieldSecurity', () => {
    it('should validate safe fields', () => {
      const result = validateFieldSecurity('safe:field', 'safe value')

      expect(result.isValid).toBe(true)
      expect(result.sanitizedField).toBe('safe-field')
      expect(result.sanitizedValue).toBe('safe value')
      // The field name change from 'safe:field' to 'safe-field' triggers a warning
      expect(result.warnings).toContain(
        'Field name contained unsafe characters'
      )
    })

    it('should detect dangerous content', () => {
      const result = validateFieldSecurity(
        'safe:field',
        '<script>alert("XSS")</script>'
      )

      expect(result.isValid).toBe(true)
      expect(result.sanitizedValue).toBe('')
      expect(result.warnings).toContain(
        'Potentially dangerous HTML detected in field value'
      )
    })

    it('should detect unsafe field names', () => {
      const result = validateFieldSecurity('field<script>', 'safe value')

      expect(result.isValid).toBe(true)
      expect(result.sanitizedField).toBe('field-script-')
      expect(result.warnings).toContain(
        'Field name contained unsafe characters'
      )
    })
  })
})
