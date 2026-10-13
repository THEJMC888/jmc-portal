"use client";
import { useState, useEffect } from "react";

const PHOTOS = [
  // Verified pure-nature keepers
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80",
  // Aurora & Night Sky
  "https://images.unsplash.com/photo-1493246507009-87bde65b0a88?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1483347057389-4c19ee7e5b1e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1531804193717-7f5df5a2aa6c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1444232571941-df09f0ef5e0a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1534120247888-f2fac6703cec?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1502223888-1d04e6b3ffb3?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1920&q=80",
  // Ocean & Coastal
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1505769481182-a91edab72e42?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1768409234914-96f61529b7e2?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1454023489773-54e1b4e7fdb2?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1462668983816-b289f39d1dc5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1604223190546-a43e4c7f29d7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1497250681960-ef46dc6cb4be?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1601281426795-9fedf41df8d1?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1520635850296-c79f68bd2cce?auto=format&fit=crop&w=1920&q=80",
  // Waterfalls
  "https://images.unsplash.com/photo-1520942702018-56b1fa07a3c2?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1530908295418-da3aaac69321?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1475688621402-4257c812033f?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1503804175975-d4e77234c671?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1471897488932-af7adc0c0843?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1518199421602-ee42af3fe3ce?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1432757408864-74ec93bcb90b?auto=format&fit=crop&w=1920&q=80",
  // Desert & Dunes
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1504701954957-d298a5bb72ae?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1455169143988-b37bea93be9b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1448448529297-5ede22cc1b39?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1610552050890-fe99536c2615?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1518020382113-a7ef8d3f65c5?auto=format&fit=crop&w=1920&q=80",
  // Mountains & Alpine
  "https://images.unsplash.com/photo-1439853949212-36652ad1f70f?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1516825994218-b2d93290b0fd?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1486915489852-72d1d96be37a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1516912481800-3bbb44ba2a5c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1529932393856-c84f6c6aa6f6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1470228225956-7c1ce7a0e1f4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1470977168631-e52745f9272c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1508739773316-c4b5f0a3e9d0?auto=format&fit=crop&w=1920&q=80",
  // Forest & Trees
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1540979388789-6cee522a624c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1568736329436-e3b36d04c38e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1440978042851-8b4eb0b036c3?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1471956797466-ab19d5db1218?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1497752531658-e35b53a8b2fe?auto=format&fit=crop&w=1920&q=80",
  // Glaciers & Ice
  "https://images.unsplash.com/photo-1760301269447-fbc82b5a8d14?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1490100042571-a1d4a5d51455?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1499424290755-0e7f73e9c35a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1612441804231-77a36b284856?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506197145622-ba2c20155cc9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1486356737229-8de13f30e4b2?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1787035957656-4fdf60760685?auto=format&fit=crop&w=1920&q=80",
  // Canyons & Rock
  "https://images.unsplash.com/photo-1464547753985-5e1ec7a76c3d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1536431696333-4218fcaa12ef?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1505765050516-f72dc64dc80c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?auto=format&fit=crop&w=1920&q=80",
  // Lakes & Reflections
  "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476673160081-cf065607f449?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1518173978526-dfd9a3bcb2c0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1429190581514-c43ba6b3c426?auto=format&fit=crop&w=1920&q=80",
  // Volcanic & Tropical
  "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1543722530-d91f3b06c80d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506261351-26e9b7b39879?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1455906547048-4bcd59cdfeeb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1611080402167-ed75bae6df32?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1509484509186-3e4b2c77cf40?auto=format&fit=crop&w=1920&q=80",
  // Additional unique landscapes
  "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1552152370-fb05b25ff17d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1458668383970-8ef32e579e5c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1455238773688-6f4c69e19575?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1466611653911-0ba8af7e3f32?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1545118636734-ea65a9ffe3e4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1450908339808-16c25dab5843?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1486693128850-a77436af7ec0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1490822546369-3b9093a95088?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1498429089284-41f8cf3ffd39?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1513836279977-76de6c5b0cd8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1612539473441-dfc1cefd5e1e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1482685945432-29a7abf2f466?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1544559832049-6ce95eff5a1e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1504180342426-5a8abe5e3e70?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1502066898869-af8a6c7e4543?auto=format&fit=crop&w=1920&q=80",
];

interface Props {
  interval?: number;
  transitionMs?: number;
}

export default function PhotoSlideshow({ interval = 7000, transitionMs = 2500 }: Props) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      const swap = window.setTimeout(() => {
        setIdx(i => (i + 1) % PHOTOS.length);
        setFading(false);
      }, transitionMs);
      return () => clearTimeout(swap);
    }, interval);
    return () => clearInterval(t);
  }, [interval, transitionMs]);

  const nextIdx = (idx + 1) % PHOTOS.length;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Base layer — current photo */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${PHOTOS[idx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Top layer — next photo fades in */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${PHOTOS[nextIdx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: fading ? 1 : 0,
          transition: fading ? `opacity ${transitionMs}ms ease-in-out` : "none",
        }}
      />
    </div>
  );
}
