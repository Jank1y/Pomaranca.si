const gumbi = document.querySelectorAll(".kosarica");
const kosarica = document.getElementById("kosarica");
const skupajZnesek = document.getElementById("skupaj-znesek");

let izdelkiVKosarici = [];

function posodobiKosarico() {
  kosarica.innerHTML = "";
  let skupaj = 0;

  izdelkiVKosarici.forEach((izdelek) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${izdelek.ime}</span>
      <div class="kolicina">
        <button class="minus">−</button>
        <span>${izdelek.kolicina}</span>
        <button class="plus">+</button>
        <strong>${(izdelek.cena * izdelek.kolicina).toFixed(2)} €</strong>
        <button class="odstrani">❌</button>
      </div>
    `;
    kosarica.appendChild(li);

    skupaj += izdelek.cena * izdelek.kolicina;

    // Povezava dogodkov
    li.querySelector(".plus").addEventListener("click", () => {
      izdelek.kolicina++;
      posodobiKosarico();
    });

    li.querySelector(".minus").addEventListener("click", () => {
      if (izdelek.kolicina > 1) {
        izdelek.kolicina--;
      } else {
        izdelkiVKosarici = izdelkiVKosarici.filter((i) => i.ime !== izdelek.ime);
      }
      posodobiKosarico();
    });

    li.querySelector(".odstrani").addEventListener("click", () => {
      izdelkiVKosarici = izdelkiVKosarici.filter((i) => i.ime !== izdelek.ime);
      posodobiKosarico();
    });
  });

  skupajZnesek.textContent = skupaj.toFixed(2) + " €";
}

gumbi.forEach((gumb) => {
  gumb.addEventListener("click", () => {
    const naslov = gumb.parentElement.querySelector("h3").textContent;
    const [imeIzdelka, cenaBesedilo] = naslov.split(" - ");
    const ime = imeIzdelka.trim();
    const cena = parseFloat(cenaBesedilo) || 0;

    const obstojeci = izdelkiVKosarici.find((i) => i.ime === ime);
    if (obstojeci) {
      obstojeci.kolicina++;
    } else {
      izdelkiVKosarici.push({ ime, cena, kolicina: 1 });
    }

    posodobiKosarico();
  });
});
/* =============================
   === BURGER MENI FUNKCIJE ===
   ============================= */

const burger = document.getElementById("burger-menu");
const kosaricaPanel = document.querySelector(".desna");
const overlay = document.getElementById("overlay");

// ODPRE KOŠARICO (samo na mobitelu)
function odpriKosarico() {
  kosaricaPanel.classList.add("odprto");
  overlay.classList.add("prikazano");
}

// ZAPRE KOŠARICO
function zapriKosarico() {
  kosaricaPanel.classList.remove("odprto");
  overlay.classList.remove("prikazano");
}

// Klik na burger
if (burger) {
  burger.addEventListener("click", odpriKosarico);
}

// Klik na overlay (zapre)
if (overlay) {
  overlay.addEventListener("click", zapriKosarico);
}

// Če klikneš "Dodaj v košarico" → zapre meni (samo telefon)
gumbi.forEach((gumb) => {
  gumb.addEventListener("click", () => {
    if (window.innerWidth < 768) {
      zapriKosarico();
    }
  });
});
const closeCartBtn = document.getElementById("close-cart");

if (closeCartBtn) {
  closeCartBtn.addEventListener("click", zapriKosarico);
}
