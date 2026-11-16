// Base44's built-in integrations. No file uploads: learners' files and
// audio are never uploaded (Prompt 13 removed the unused UploadFile export).
import { base44 } from './base44Client';

export const Core = base44.integrations.Core;

export const InvokeLLM = base44.integrations.Core.InvokeLLM;

export const SendEmail = base44.integrations.Core.SendEmail;

export const SendSMS = base44.integrations.Core.SendSMS;

export const GenerateImage = base44.integrations.Core.GenerateImage;
