
// Ana site adresi her zaman gerçek intro ile açılır.
// Sadece iç sayfalardaki "ANA SAYFA" bağlantıları ?direct=1 gönderdiğinde
// intro atlanır ve tamamlanmış ana sayfa doğrudan gösterilir.
const HOME_DIRECT =
    new URLSearchParams(window.location.search).get("direct") === "1";

// Tarayıcının önceki kaydırma konumunu geri yükleyip "Seçili Çalışmalar"
// bölümünü introdan önce göstermesini engelle.
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

if (!HOME_DIRECT) {
    window.scrollTo(0, 0);
}


function showHomeDirectly() {
    const intro = document.getElementById("intro");
    const logoContainer = document.getElementById("logo-container");
    const nameLogo = document.querySelector(".brand-name, #brand-name, .name-logo, #name-logo");

    if (!intro || !logoContainer) return;

    // Intro'nun animasyon sonunda ulaştığı gerçek görünümü doğrudan kur.
    intro.style.backgroundColor = "#f3eadc";
    document.body.style.backgroundColor = "#f3eadc";

    // SVG'de oluşturulan krem logo katmanlarını finalde siyah göster.
    document.querySelectorAll(".generated-logo-fill").forEach((fill) => {
        fill.setAttribute("fill", "#050505");
        fill.style.fill = "#050505";
        fill.style.transition = "none";
    });

    // Reveal maskelerini tamamen aç: 4 logosunun BİTMİŞ HALİ eksiksiz görünür.
    STROKES.forEach((stroke) => {
        if (stroke.maskGuide) {
            stroke.maskGuide.style.strokeDashoffset = "0";
            stroke.maskGuide.setAttribute("stroke-dashoffset", "0");
        }
        if (stroke.revealGroup) {
            stroke.revealGroup.style.visibility = "visible";
            stroke.revealGroup.style.opacity = "1";
        }
    });

    // Intro sonunda kullanılan CSS durumlarını uygula.
    intro.classList.add("header-state", "show-name", "hero-ready");

    // Logo için inline animasyon kalıntısı varsa temizle.
    logoContainer.style.transition = "none";

    // İsim logosu varsa görünür tut.
    if (nameLogo) {
        nameLogo.style.opacity = "1";
        nameLogo.style.visibility = "visible";
    }

    sessionStorage.setItem("4kareIntroPlayed", "1");

    document.body.classList.add("site-ready");
    document.body.classList.remove("intro-pending");
    window.scrollTo(0, 0);

    if (history.replaceState) {
        history.replaceState({}, "", "index.html");
    }
}

const SVG_PATH = "assets/logo/4kare-logo-son.svg";

const LOGO_COLOR = "#f3eadc";

const STROKES = [
    { step: 1, guide: "step-1-guide", duration: 552 },
    { step: 2, guide: "step-2-guide", duration: 442 },
    { step: 3, guide: "step-3-guide", duration: 510 },
    { step: 4, guide: "step-4-guide", duration: 425 },
    { step: 5, guide: "step-5-guide", duration: 468 },
    { step: 6, guide: "step-6-guide", duration: 425 },
    { step: 7, guide: "step-7-guide", duration: 468 }
];

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}

async function loadLogo() {
    const logoHost = document.getElementById("animated-logo");

    try {
        const response = await fetch(SVG_PATH);

        if (!response.ok) {
            throw new Error(`SVG yüklenemedi: ${response.status}`);
        }

        const svgText = await response.text();
        logoHost.innerHTML = svgText;

        const svg = logoHost.querySelector("svg");

        if (!svg) {
            throw new Error("SVG elementi bulunamadı.");
        }

        const images = Array.from(svg.querySelectorAll("image"));

        if (images.length < 7) {
            throw new Error(
                `7 logo parçası bekleniyordu. ${images.length} image bulundu.`
            );
        }

        const imageGroups = [];

        images.forEach((image) => {
            const group = image.closest("g");

            if (group && !imageGroups.includes(group)) {
                imageGroups.push(group);
            }
        });

        STROKES.forEach((stroke) => {
            const shape = findStepGroup(svg, imageGroups, stroke.step);
            const guideGroup = svg.querySelector(`#${stroke.guide}`);

            if (!shape) {
                throw new Error(`${stroke.step}. adım görüntüsü bulunamadı.`);
            }

            if (!guideGroup) {
                throw new Error(`Guide bulunamadı: ${stroke.guide}`);
            }

            stroke.shape = shape;
            stroke.originalGuide = guideGroup;
        });

        prepareLogo(svg);
        // SVG hazırlanırken ham logo bir kareliğine görünmesin (özellikle Android Chrome).
        logoHost.classList.add("logo-prepared");

        await nextFrame();
        await nextFrame();

        if (HOME_DIRECT) {
            showHomeDirectly();
            return;
        }

        // Sadece gerçek ilk girişte intro gecikmesi ve animasyonu.
        await wait(450);
        await playIntro();

    } catch (error) {
        console.error("Logo yükleme hatası:", error);
        // SVG yüklenemezse kullanıcı siyah ekranda kalmasın.
        document.body.classList.remove("intro-pending");
        document.body.classList.add("site-ready");
        window.scrollTo(0, 0);
    }
}

function findStepGroup(svg, groups, stepNumber) {
    const candidates = Array.from(svg.querySelectorAll("g"));

    const numberPatterns = [
        `${stepNumber}.`,
        `_${stepNumber}.`,
        `_x3${stepNumber}_`,
        `x3${stepNumber}`
    ];

    for (const group of candidates) {
        if (!group.querySelector("image")) {
            continue;
        }

        const id = group.id || "";

        const decoded = id
            .replace(/_x33_/g, "3")
            .replace(/_x34_/g, "4")
            .replace(/_x35_/g, "5")
            .replace(/_x36_/g, "6")
            .replace(/_x37_/g, "7")
            .replace(/_x31_/g, "1")
            .replace(/_x32_/g, "2");

        if (
            decoded.includes(`${stepNumber}.adım`) ||
            decoded.includes(`${stepNumber}.ad`)
        ) {
            return group;
        }

        if (numberPatterns.some((pattern) => id.includes(pattern))) {
            return group;
        }
    }

    return groups[stepNumber - 1] || null;
}

function prepareLogo(svg) {
    const NS = "http://www.w3.org/2000/svg";

    let defs = svg.querySelector("defs");

    if (!defs) {
        defs = document.createElementNS(NS, "defs");
        svg.insertBefore(defs, svg.firstChild);
    }

    const viewBox = svg.viewBox.baseVal;

    STROKES.forEach((stroke, index) => {
        const sourceGroup = stroke.shape;
        const originalGuideGroup = stroke.originalGuide;

        const guidePath =
            originalGuideGroup.querySelector("path") ||
            originalGuideGroup.querySelector("line") ||
            originalGuideGroup.querySelector("polyline") ||
            originalGuideGroup;

        if (typeof guidePath.getTotalLength !== "function") {
            throw new Error(
                `${stroke.guide} içinde ölçülebilir yol bulunamadı.`
            );
        }

        const length = guidePath.getTotalLength();
        const shapeBox = sourceGroup.getBBox();

        let guideBox;

        try {
            guideBox = guidePath.getBBox();
        } catch {
            guideBox = {
                width: shapeBox.width,
                height: shapeBox.height
            };
        }

        const verticalGuide = guideBox.height >= guideBox.width;

        let brushWidth = verticalGuide
            ? shapeBox.width
            : shapeBox.height;

        const maxReasonableWidth = Math.min(
            Math.max(viewBox.width, viewBox.height) * 0.24,
            140
        );

        brushWidth = Math.min(brushWidth, maxReasonableWidth);
        brushWidth *= 1.35;
        brushWidth = Math.max(brushWidth, 35);

        const shapeMask = document.createElementNS(NS, "mask");
        const shapeMaskId = `shape-alpha-mask-${index + 1}`;

        shapeMask.setAttribute("id", shapeMaskId);
        shapeMask.setAttribute("maskUnits", "userSpaceOnUse");
        shapeMask.setAttribute("maskContentUnits", "userSpaceOnUse");
        shapeMask.setAttribute("mask-type", "alpha");
        shapeMask.style.maskType = "alpha";
        shapeMask.setAttribute("x", String(viewBox.x));
        shapeMask.setAttribute("y", String(viewBox.y));
        shapeMask.setAttribute("width", String(viewBox.width));
        shapeMask.setAttribute("height", String(viewBox.height));

        const sourceClone = sourceGroup.cloneNode(true);

        sourceClone.removeAttribute("id");
        sourceClone.style.opacity = "1";
        sourceClone.style.display = "";

        shapeMask.appendChild(sourceClone);
        defs.appendChild(shapeMask);

        const creamRect = document.createElementNS(NS, "rect");

        creamRect.setAttribute("x", String(viewBox.x));
        creamRect.setAttribute("y", String(viewBox.y));
        creamRect.setAttribute("width", String(viewBox.width));
        creamRect.setAttribute("height", String(viewBox.height));
        creamRect.setAttribute("fill", LOGO_COLOR);
        creamRect.classList.add("generated-logo-fill");
        creamRect.setAttribute("mask", `url(#${shapeMaskId})`);

        const revealMask = document.createElementNS(NS, "mask");
        const revealMaskId = `brush-reveal-mask-${index + 1}`;

        revealMask.setAttribute("id", revealMaskId);
        revealMask.setAttribute("maskUnits", "userSpaceOnUse");
        revealMask.setAttribute("maskContentUnits", "userSpaceOnUse");
        // Android Chrome/SVG: reveal maskesinin alpha olarak yorumlanmasını engelle.
        // Siyah arka plan = gizli, beyaz fırça = görünür olmalı.
        revealMask.setAttribute("mask-type", "luminance");
        revealMask.style.maskType = "luminance";
        revealMask.setAttribute("x", String(viewBox.x));
        revealMask.setAttribute("y", String(viewBox.y));
        revealMask.setAttribute("width", String(viewBox.width));
        revealMask.setAttribute("height", String(viewBox.height));

        const blackBackground = document.createElementNS(NS, "rect");

        blackBackground.setAttribute("x", String(viewBox.x));
        blackBackground.setAttribute("y", String(viewBox.y));
        blackBackground.setAttribute("width", String(viewBox.width));
        blackBackground.setAttribute("height", String(viewBox.height));
        blackBackground.setAttribute("fill", "black");

        revealMask.appendChild(blackBackground);

        const animatedGuide = guidePath.cloneNode(true);

        animatedGuide.removeAttribute("id");
        animatedGuide.removeAttribute("class");
        animatedGuide.removeAttribute("style");
        animatedGuide.removeAttribute("pathLength");

        animatedGuide.setAttribute("fill", "none");
        animatedGuide.setAttribute("stroke", "white");
        animatedGuide.setAttribute("stroke-width", String(brushWidth));
        animatedGuide.setAttribute("stroke-linecap", "round");
        animatedGuide.setAttribute("stroke-linejoin", "round");

        animatedGuide.style.strokeDasharray = `${length} ${length}`;
        animatedGuide.style.strokeDashoffset = `${length}`;

        revealMask.appendChild(animatedGuide);
        defs.appendChild(revealMask);

        const revealGroup = document.createElementNS(NS, "g");

        revealGroup.setAttribute("mask", `url(#${revealMaskId})`);
        revealGroup.appendChild(creamRect);

        // Gelecek adımların maskeden sızan tek bir pikseli bile başlangıçta görünmesin.
        // İlgili adım başladığında animateStroke() bu grubu görünür yapacak.
        revealGroup.style.visibility = "hidden";
        revealGroup.style.opacity = "0";
        sourceGroup.parentNode.insertBefore(revealGroup, sourceGroup);

        sourceGroup.style.display = "none";

        originalGuideGroup.style.opacity = "0";
        originalGuideGroup.style.pointerEvents = "none";

        stroke.maskGuide = animatedGuide;
        stroke.revealGroup = revealGroup;
        stroke.length = length;
        stroke.brushWidth = brushWidth;

        console.log(
            `Adım ${stroke.step}: ${Math.round(length)}px | maske ${Math.round(brushWidth)}px`
        );
    });
}

function animateStroke(stroke) {
    return new Promise((resolve) => {
        const guide = stroke.maskGuide;

        if (!guide) {
            resolve();
            return;
        }

        // Sadece sırası gelen parçayı aç. Böylece 7. adımın kare ucu gibi
        // sonraki parçalardan hiçbir şey ilk karede görünemez.
        if (stroke.revealGroup) {
            stroke.revealGroup.style.visibility = "visible";
            stroke.revealGroup.style.opacity = "1";
        }

        // Her adımı kesin olarak sıfırdan başlat. Mobil tarayıcıların önceki
        // maske raster'ını bir kare göstermesini de engeller.
        guide.style.strokeDasharray = `${stroke.length} ${stroke.length}`;
        guide.style.strokeDashoffset = `${stroke.length}`;
        guide.setAttribute("stroke-dashoffset", String(stroke.length));

        const start = performance.now();
        const duration = stroke.duration;
        const length = stroke.length;

        function frame(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);

            // Linear hareket:
            // adım başında/sonunda hızlanma-yavaşlama yok.
            const offset = length * (1 - progress);

            guide.style.strokeDashoffset = `${offset}`;
            guide.setAttribute("stroke-dashoffset", String(offset));
            // Mobil Chromium mask içindeki CSS değişimini her karede yeniden boyamayabiliyor.
            // Attribute'u da güncellemek maskenin kararlı biçimde çizilmesini sağlıyor.
            guide.setAttribute("stroke-dashoffset", String(offset));

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                guide.style.strokeDashoffset = "0";
                guide.setAttribute("stroke-dashoffset", "0");
                resolve();
            }
        }

        requestAnimationFrame(frame);
    });
}

async function playIntro() {
    sessionStorage.setItem("4kareIntroPlayed", "1");
    // Adımlar arasında bilinçli hiçbir bekleme yok.
    await animateStroke(STROKES[0]);
    await animateStroke(STROKES[1]);
    await animateStroke(STROKES[2]);
    await animateStroke(STROKES[3]);
    await animateStroke(STROKES[4]);
    await animateStroke(STROKES[5]);
    await animateStroke(STROKES[6]);

    console.log("4 Kare çizim animasyonu tamamlandı.");

    await finishIntro();
}

async function finishIntro() {
    const intro = document.getElementById("intro");
    const logoFills = document.querySelectorAll(".generated-logo-fill");

    // Çizim tamamlandıktan sonra çok kısa süre tam logo görünsün.
    await wait(220);

    // Logo sol üste giderken renkler de AYNI ANDA değişsin.
    intro.classList.add("header-state");
    intro.style.backgroundColor = "#f3eadc";
    document.body.style.backgroundColor = "#f3eadc";
    logoFills.forEach((fill) => fill.setAttribute("fill", "#050505"));

    // Logo hareketi tamamlanınca isim soldan sağa açılsın.
    await wait(850);
    intro.classList.add("show-name");

    // İsim logosu açılırken ana tasarım da yumuşakça görünür.
    await wait(520);
    intro.classList.add("hero-ready");
    // Sayfanın devamını ancak intro tamamen bittikten sonra kaydırılabilir yap.
    document.body.classList.add("site-ready");
    document.body.classList.remove("intro-pending");
    window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", () => {
    if (!HOME_DIRECT) {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }
    loadLogo();
});

// Tam ekran menü
document.addEventListener("DOMContentLoaded", () => {
    const menu = document.getElementById("fullscreen-menu");
    const openButton = document.getElementById("menu-toggle");
    const closeButton = document.getElementById("menu-close");

    if (!menu || !openButton || !closeButton) return;

    const openMenu = () => {
        menu.classList.add("is-open");
        menu.setAttribute("aria-hidden", "false");
        openButton.setAttribute("aria-expanded", "true");
    };

    const closeMenu = () => {
        menu.classList.remove("is-open");
        menu.setAttribute("aria-hidden", "true");
        openButton.setAttribute("aria-expanded", "false");
    };

    openButton.addEventListener("click", openMenu);
    closeButton.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });
});
