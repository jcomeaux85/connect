import { base44 } from './base44Client';
import { invokeAI } from './aiProvider';



export const Core = base44.integrations.Core;

// Legacy import path — routed through the vendor-blind adapter so ANY code
// using this export automatically follows the configured AI provider.
export const InvokeLLM = invokeAI;

export const SendEmail = base44.integrations.Core.SendEmail;

export const SendSMS = base44.integrations.Core.SendSMS;

export const UploadFile = base44.integrations.Core.UploadFile;

export const GenerateImage = base44.integrations.Core.GenerateImage;

export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;






