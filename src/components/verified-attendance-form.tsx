"use client";

import { Camera, CheckCircle2, LocateFixed, MapPin, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AttendanceAction = (formData: FormData) => void | Promise<void>;

type LocationProof = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export function VerifiedAttendanceForm({
  action,
  submitLabel,
  disabled
}: {
  action: AttendanceAction;
  submitLabel: string;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [location, setLocation] = useState<LocationProof | null>(null);
  const [clientCapturedAt, setClientCapturedAt] = useState("");
  const [message, setMessage] = useState("Ambil foto dan lokasi untuk absen terverifikasi.");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Browser belum mendukung akses kamera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setMessage("Kamera aktif. Ambil foto sebelum mengirim absen.");
    } catch {
      setMessage("Akses kamera ditolak atau tidak tersedia.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !cameraReady) {
      setMessage("Aktifkan kamera terlebih dahulu.");
      return;
    }

    const width = 360;
    const ratio = video.videoHeight && video.videoWidth ? video.videoHeight / video.videoWidth : 0.75;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(width * ratio);
    const context = canvas.getContext("2d");
    if (!context) {
      setMessage("Foto tidak dapat diproses.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.78));
    setClientCapturedAt(new Date().toISOString());
    setMessage("Foto tersimpan. Ambil lokasi untuk melengkapi bukti.");
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setMessage("Browser belum mendukung lokasi.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setMessage("Lokasi tersimpan. Absen terverifikasi siap dikirim.");
      },
      () => {
        setMessage("Akses lokasi ditolak atau belum tersedia.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 15000
      }
    );
  }

  const canSubmit = Boolean(photoDataUrl && location && !disabled);

  return (
    <form action={action} className="verified-form">
      <input name="attendanceMode" type="hidden" value="camera_location" />
      <input name="photoDataUrl" type="hidden" value={photoDataUrl} />
      <input name="latitude" type="hidden" value={location?.latitude ?? ""} />
      <input name="longitude" type="hidden" value={location?.longitude ?? ""} />
      <input name="accuracy" type="hidden" value={location?.accuracy ?? ""} />
      <input name="clientCapturedAt" type="hidden" value={clientCapturedAt} />

      <div className="verification-grid">
        <div className="camera-box">
          {photoDataUrl ? (
            <img alt="Foto bukti absensi" src={photoDataUrl} />
          ) : (
            <video ref={videoRef} autoPlay muted playsInline />
          )}
        </div>
        <div className="verification-steps">
          <button className="secondary-button" type="button" onClick={startCamera} disabled={disabled}>
            <Video size={18} aria-hidden="true" />
            Aktifkan Kamera
          </button>
          <button className="secondary-button" type="button" onClick={capturePhoto} disabled={disabled}>
            <Camera size={18} aria-hidden="true" />
            Ambil Foto
          </button>
          <button className="secondary-button" type="button" onClick={captureLocation} disabled={disabled}>
            <LocateFixed size={18} aria-hidden="true" />
            Ambil Lokasi
          </button>
        </div>
      </div>

      <div className="proof-status">
        <span className={photoDataUrl ? "proof-ok" : ""}>
          <CheckCircle2 size={16} aria-hidden="true" />
          Foto
        </span>
        <span className={location ? "proof-ok" : ""}>
          <MapPin size={16} aria-hidden="true" />
          {location ? `GPS ${Math.round(location.accuracy)} m` : "Lokasi"}
        </span>
      </div>

      <p className="helper-text">{message}</p>

      {location ? (
        <a
          className="map-link"
          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
          rel="noreferrer"
          target="_blank"
        >
          Lihat titik lokasi
        </a>
      ) : null}

      <div className="button-row">
        <button className="primary-button" disabled={!canSubmit} type="submit">
          <Camera size={18} aria-hidden="true" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
