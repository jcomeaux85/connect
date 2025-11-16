import { base44 } from "@/api/base44Client";

/**
 * AI Helper Functions for Call Center Hub
 * All functions use base44's secure InvokeLLM integration
 */

// 1. Auto-Summarize Calls
export async function summarizeCall(callNotes, duration, outcome) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert insurance call center analyst. Summarize this call professionally.

Call Duration: ${duration} seconds
Call Outcome: ${outcome}
Call Notes: ${callNotes}

Provide a concise summary with key points and action items.`,
    response_json_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Brief 2-3 sentence summary" },
        key_points: { 
          type: "array", 
          items: { type: "string" },
          description: "3-5 key discussion points"
        },
        action_items: { 
          type: "array", 
          items: { type: "string" },
          description: "Follow-up actions needed"
        },
        customer_sentiment: {
          type: "string",
          enum: ["satisfied", "neutral", "frustrated", "angry"],
          description: "Customer's emotional state"
        }
      }
    }
  });
  return result;
}

// 2. Smart Note Suggestions
export async function suggestNotes(caseType, callCategory, customerMessage) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an insurance documentation assistant. Based on this call information, suggest what should be documented:

Case Type: ${caseType}
Call Category: ${callCategory}
Customer Message: ${customerMessage}

Suggest specific things the agent should document.`,
    response_json_schema: {
      type: "object",
      properties: {
        suggested_notes: {
          type: "array",
          items: { type: "string" },
          description: "Specific items to document"
        },
        required_fields: {
          type: "array",
          items: { type: "string" },
          description: "Must-have information for this case type"
        },
        tips: {
          type: "array",
          items: { type: "string" },
          description: "Best practices for this situation"
        }
      }
    }
  });
  return result;
}

// 3. Priority Detection
export async function detectPriority(customerMessage, caseType, customerHistory) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an insurance triage expert. Analyze this case and determine priority level.

Case Type: ${caseType}
Customer Message: ${customerMessage}
Customer History: ${customerHistory || "New customer"}

Determine the urgency and priority level.`,
    response_json_schema: {
      type: "object",
      properties: {
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Recommended priority level"
        },
        urgency_score: {
          type: "number",
          description: "Urgency score from 1-10"
        },
        reasoning: {
          type: "string",
          description: "Why this priority was assigned"
        },
        red_flags: {
          type: "array",
          items: { type: "string" },
          description: "Any concerning indicators"
        },
        recommended_sla: {
          type: "string",
          description: "Suggested response timeframe"
        }
      }
    }
  });
  return result;
}

// 4. Response Templates
export async function generateResponse(inquiry, customerName, caseType, tone = "professional") {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a professional insurance customer service representative. Generate a helpful response.

Customer Name: ${customerName}
Case Type: ${caseType}
Customer Inquiry: ${inquiry}
Tone: ${tone}

Write a professional, empathetic response that addresses their concern.`,
    response_json_schema: {
      type: "object",
      properties: {
        response: {
          type: "string",
          description: "Complete response message"
        },
        sms_version: {
          type: "string",
          description: "Shorter version suitable for SMS"
        },
        email_subject: {
          type: "string",
          description: "Suggested email subject line"
        },
        tone_used: {
          type: "string",
          description: "The tone applied"
        }
      }
    }
  });
  return result;
}

// 5. Quality Scoring
export async function scoreCallQuality(callTranscript, agentNotes, resolution) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a call center quality assurance manager. Evaluate this interaction.

Call Transcript/Notes: ${callTranscript}
Agent Documentation: ${agentNotes}
Resolution: ${resolution || "Pending"}

Score the quality of this interaction.`,
    response_json_schema: {
      type: "object",
      properties: {
        overall_score: {
          type: "number",
          description: "Score from 1-100"
        },
        professionalism: {
          type: "number",
          description: "Score from 1-10"
        },
        empathy: {
          type: "number",
          description: "Score from 1-10"
        },
        problem_solving: {
          type: "number",
          description: "Score from 1-10"
        },
        documentation: {
          type: "number",
          description: "Score from 1-10"
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "What was done well"
        },
        improvements: {
          type: "array",
          items: { type: "string" },
          description: "Areas to improve"
        },
        training_recommendations: {
          type: "array",
          items: { type: "string" },
          description: "Suggested training topics"
        }
      }
    }
  });
  return result;
}

// 6. Predictive Routing
export async function recommendAgent(caseDetails, availableAgents) {
  const agentsInfo = availableAgents.map(agent => 
    `${agent.email}: ${agent.specialties || 'General'} - ${agent.caseload || 0} active cases`
  ).join('\n');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an intelligent case routing system. Recommend the best agent for this case.

Case Details: ${JSON.stringify(caseDetails, null, 2)}

Available Agents:
${agentsInfo}

Consider: expertise match, current workload, case complexity, and past performance.`,
    response_json_schema: {
      type: "object",
      properties: {
        recommended_agent: {
          type: "string",
          description: "Email of best-matched agent"
        },
        match_score: {
          type: "number",
          description: "Match confidence from 1-100"
        },
        reasoning: {
          type: "string",
          description: "Why this agent was selected"
        },
        alternative_agents: {
          type: "array",
          items: { type: "string" },
          description: "Backup agent recommendations"
        },
        estimated_resolution_time: {
          type: "string",
          description: "Expected time to resolution"
        }
      }
    }
  });
  return result;
}

// 7. Compliance Checker
export async function checkCompliance(noteContent, caseType, regulatoryContext = "insurance") {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a compliance officer for insurance documentation. Review this note for compliance.

Regulatory Context: ${regulatoryContext}
Case Type: ${caseType}
Note Content: ${noteContent}

Check for: HIPAA compliance, required disclosures, prohibited language, and documentation standards.`,
    response_json_schema: {
      type: "object",
      properties: {
        compliant: {
          type: "boolean",
          description: "Whether note meets compliance standards"
        },
        compliance_score: {
          type: "number",
          description: "Compliance score from 1-100"
        },
        issues: {
          type: "array",
          items: { type: "string" },
          description: "Compliance issues found"
        },
        suggestions: {
          type: "array",
          items: { type: "string" },
          description: "How to improve compliance"
        },
        missing_elements: {
          type: "array",
          items: { type: "string" },
          description: "Required information not included"
        },
        risk_level: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Compliance risk level"
        }
      }
    }
  });
  return result;
}

// Batch analyze multiple cases for insights
export async function analyzeCaseTrends(cases) {
  const caseSummary = cases.slice(0, 20).map(c => ({
    type: c.case_type,
    priority: c.priority,
    status: c.status,
    duration: c.updated_date ? new Date(c.updated_date) - new Date(c.created_date) : null
  }));

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a call center analytics expert. Analyze these recent cases for trends and insights.

Cases: ${JSON.stringify(caseSummary, null, 2)}

Identify patterns, common issues, and recommendations.`,
    response_json_schema: {
      type: "object",
      properties: {
        top_issues: {
          type: "array",
          items: { type: "string" },
          description: "Most common customer issues"
        },
        trend_analysis: {
          type: "string",
          description: "Overall trend description"
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "Process improvement suggestions"
        },
        peak_times: {
          type: "array",
          items: { type: "string" },
          description: "When cases spike"
        },
        staffing_recommendation: {
          type: "string",
          description: "Staffing suggestions based on volume"
        }
      }
    }
  });
  return result;
}