import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

export const watermarkVideo = ({ inputPath, outputPath, photoPath, qrPath }) => {
  return new Promise((resolve, reject) => {
    
    // 0-Index: Asosiy video
    const command = ffmpeg(inputPath);

    let complexFilter = [];

    // Agar mijoz rasmi mavjud bo'lsa
    if (photoPath && fs.existsSync(photoPath)) {
      command.input(qrPath);    // Index 1: Tiniq, logotipli QR Kod
      command.input(photoPath); // Index 2: Mijoz rasmi
      
      complexFilter = [
        // QR Kodni hajmini sozlash (180x180)
        "[1:v]scale=180:180[qr_scaled]",
        
        // Mijoz rasmini hajmini sozlash (150x150 kvadrat)
        "[2:v]scale=150:150:force_original_aspect_ratio=increase,crop=150:150[photo_scaled]",
        
        // JOYLASHUV 1: QR Kod CHAP YUQORIGA (chetdan 40px)
        "[0:v][qr_scaled]overlay=40:40[v1]",
        
        // JOYLASHUV 2: Mijoz rasmi O'NG YUQORIGA (chetdan 40px)
        "[v1][photo_scaled]overlay=W-w-40:40[outv]"
      ];
    } else {
      // Faqat QR kod bo'lsa
      command.input(qrPath); // Index 1: QR Kod
      
      complexFilter = [
        "[1:v]scale=180:180[qr_scaled]",
        
        // JOYLASHUV: QR Kod CHAP YUQORIGA
        "[0:v][qr_scaled]overlay=40:40[outv]"
      ];
    }

    command
      .complexFilter(complexFilter)
      .outputOptions([
        '-map', '[outv]', // Tayyorlangan vizual videoni olish
        '-map', '0:a?',   // Original ovozni saqlab qolish
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '192k'
      ])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err));
  });
};