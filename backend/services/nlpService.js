/**
 * NLP Service for parsing trip-related messages
 * Extracts: source, destination, startDate, endDate, days, budget
 */

const greetings = [
  'hi',
  'hello',
  'hey',
  'how are you',
  'howdy',
  'good morning',
  'good afternoon',
  'good evening'
];

function isGreeting(message) {
  const lowerMsg = message.toLowerCase().trim();
  return greetings.some(greeting => {
    return lowerMsg === greeting || lowerMsg.startsWith(`${greeting} `) || lowerMsg.includes(` ${greeting}`);
  });
}

function detectIntent(message) {
  const lowerMsg = message.toLowerCase().trim();
  if (isGreeting(lowerMsg)) {
    return 'greeting';
  }

  if (lowerMsg.includes('from') && lowerMsg.includes('to')) {
    return 'trip_request';
  }

  return 'fallback';
}

function formatDate(input) {
  const ddmmyyyy = /^([0-3]\d)-([0-1]\d)-(\d{4})$/;
  const yyyymmdd = /^(\d{4})-([0-1]\d)-([0-3]\d)$/;

  const ddmmyyyyMatch = input.match(ddmmyyyy);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month}-${day}`;
  }

  const yyyymmddMatch = input.match(yyyymmdd);
  if (yyyymmddMatch) {
    return input;
  }

  // Handle month names like "June 10" or "June 10, 2024"
  const monthNames = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12',
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };

  const monthNameMatch = input.match(/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/i);
  if (monthNameMatch) {
    const [, monthName, day, year] = monthNameMatch;
    const month = monthNames[monthName.toLowerCase()];
    const fullYear = year || new Date().getFullYear().toString();
    const dayPadded = day.padStart(2, '0');
    return `${fullYear}-${month}-${dayPadded}`;
  }

  return null;
}

function parseTripDetails(message) {
  const result = {
    source: null,
    destination: null,
    startDate: null,
    endDate: null,
    days: null,
    budget: null,
    confidence: 0,
    isValid: false,
    error: null
  };

  const normalized = message.replace(/\s+/g, ' ').trim();

  const fromToMatch = normalized.match(/from\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+to\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)(?=\s+(?:starting|return|with|budget|on|from|to)|$)/i);
  const toFromMatch = normalized.match(/to\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+from\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)(?=\s+(?:starting|return|with|budget|on|from|to)|$)/i);

  if (fromToMatch && toFromMatch) {
    if (fromToMatch.index <= toFromMatch.index) {
      result.source = fromToMatch[1].trim();
      result.destination = fromToMatch[2].trim();
    } else {
      result.destination = toFromMatch[1].trim();
      result.source = toFromMatch[2].trim();
    }
  } else if (fromToMatch) {
    result.source = fromToMatch[1].trim();
    result.destination = fromToMatch[2].trim();
  } else if (toFromMatch) {
    result.destination = toFromMatch[1].trim();
    result.source = toFromMatch[2].trim();
  }

  if (!result.destination) {
    const destinationMatch = normalized.match(/to\s+([A-Za-z]+(?:\s+[A-Za-z]+)*?)(?=\s+from\s+| \s+(?:starting on|starting|return on|return|departing|depart|arriving|arrive|on|with|budget|for|$|\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2}|[a-z]+\s+\d{1,2}))/i);
    if (destinationMatch) {
      result.destination = destinationMatch[1].trim();
    }
  }

  if (!result.source) {
    const sourceMatch = normalized.match(/from\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)(?=\s+(?:to|starting on|starting|return on|return|departing|depart|arriving|arrive|on|with|budget|for|$|\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2}|[a-z]+\s+\d{1,2}))/i);
    if (sourceMatch) {
      result.source = sourceMatch[1].trim();
    }
  }

  const dateMatches = normalized.match(/(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})/g) || [];
  const convertedDates = dateMatches.map(formatDate).filter(Boolean);
  if (convertedDates.length > 0) {
    result.startDate = convertedDates[0];
  }
  if (convertedDates.length > 1) {
    result.endDate = convertedDates[1];
  }

  // Handle month name ranges like "June 10 to June 14"
  const monthRangeMatch = normalized.match(/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s+to\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:,?\s+(\d{4}))?/i);
  if (monthRangeMatch && !result.startDate && !result.endDate) {
    const [, startMonth, startDay, endMonth, endDay, year] = monthRangeMatch;
    result.startDate = formatDate(`${startMonth} ${startDay}${year ? `, ${year}` : ''}`);
    result.endDate = formatDate(`${endMonth} ${endDay}${year ? `, ${year}` : ''}`);
  }

  const startDateMatch = normalized.match(/(?:from|starting on|start(?:ing)?(?: date)?(?: is)?|start date|begin(?:ning)? on)\s+(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2}|[a-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i);
  if (startDateMatch) {
    const formatted = formatDate(startDateMatch[1]);
    if (formatted) {
      result.startDate = formatted;
    }
  }

  const endDateMatch = normalized.match(/(?:to|return(?:ing)? on|return date(?: is)?|back on|until|depart(?:ing)? back on?)\s+(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2}|[a-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i);
  if (endDateMatch && !result.endDate) {
    const formatted = formatDate(endDateMatch[1]);
    if (formatted) {
      result.endDate = formatted;
    }
  }

  if (!result.endDate) {
    const dayMatch = normalized.match(/for\s+(\d+)\s+days?/i)
      || normalized.match(/stay\s+(?:for\s+)?(\d+)\s+days?/i)
      || normalized.match(/(\d+)\s+days?\b/i);
    if (dayMatch) {
      result.days = parseInt(dayMatch[1], 10);
    }
  }

  if (result.startDate && !result.endDate && result.days) {
    const start = new Date(result.startDate);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(start.getDate() + result.days - 1);
      result.endDate = end.toISOString().split('T')[0];
    }
  }

  const budgetMatch = normalized.match(/(?:budget|budgt|budg(?:et)?)\s*(?:of\s*)?([0-9,]+)/i)
    || normalized.match(/(?:₹|rs\.?|inr)\s*([0-9,]+)/i)
    || normalized.match(/with\s*(?:a\s*)?(?:budget|budgt|budg(?:et)?)\s*(?:of\s*)?([0-9,]+)/i);
  if (budgetMatch) {
    result.budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
  }

  if (result.destination) {
    // Clean destination by removing common prefixes
    result.destination = result.destination
      .replace(/^(go to|travel to|visit|trip to|fly to|head to|journey to)\s+/i, '')
      .trim();
  }

  if (result.source) {
    // Clean source by removing common prefixes
    result.source = result.source
      .replace(/^(from|depart from|leave from|start from)\s+/i, '')
      .trim();
  }

  if (result.destination) result.confidence += 0.3;
  if (result.source) result.confidence += 0.2;
  if (result.startDate && result.endDate) result.confidence += 0.3;
  if (result.budget) result.confidence += 0.2;

  if (!result.destination) {
    result.error = 'Could not extract destination.';
  }
  if (!result.startDate || !result.endDate) {
    result.error = result.error ? result.error + ' Could not extract full date range.' : 'Could not extract full date range.';
  }
  if (!result.budget) {
    result.error = result.error ? result.error + ' Could not extract budget.' : 'Could not extract budget.';
  }

  result.isValid = Boolean(result.source && result.destination && result.startDate && result.endDate && result.budget);
  return result;
}

module.exports = {
  isGreeting,
  detectIntent,
  parseTripDetails
};
