/* ---------- obstoječa košarica (tvoja koda) ---------- */
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

    together = skupaj += izdelek.cena * izdelek.kolicina;

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

/* ---------- dodatne funkcije: burger, overlay, zapiranje ---------- */
const burger = document.getElementById("burger-menu");
const kosaricaPanel = document.querySelector(".desna");
const overlay = document.getElementById("overlay");
const closeCartBtn = document.getElementById("close-cart");
const oddajBtn = document.getElementById("oddaj-narocilo");

function odpriKosarico() {
  kosaricaPanel.classList.add("odprto");
  overlay.classList.add("prikazano");
}

function zapriKosarico() {
  kosaricaPanel.classList.remove("odprto");
  overlay.classList.remove("prikazano");
}

if (burger) {
  burger.addEventListener("click", odpriKosarico);
}
if (overlay) {
  overlay.addEventListener("click", zapriKosarico);
}
if (closeCartBtn) {
  closeCartBtn.addEventListener("click", zapriKosarico);
}

/* ob kliku "Dodaj v košarico" zaprje meni na mobitelu (iz prejšnjih dodank) */
gumbi.forEach((gumb) => {
  gumb.addEventListener("click", () => {
    if (window.innerWidth < 768) {
      zapriKosarico();
    }
  });
});

/* ---------- ORDER modal in submit ---------- */
const orderModal = document.getElementById("order-modal");
const orderForm = document.getElementById("order-form");
const cancelOrder = document.getElementById("cancel-order");

oddajBtn.addEventListener("click", () => {
  // ne dovoli oddaje prazne košarice
  if (izdelkiVKosarici.length === 0) {
    alert("Košarica je prazna — dodaj izdelke preden oddaš naročilo.");
    return;
  }
  orderModal.classList.add("prikazano");
  overlay.classList.add("prikazano");
});

cancelOrder.addEventListener("click", () => {
  orderModal.classList.remove("prikazano");
  overlay.classList.remove("prikazano");
});

orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ime = document.getElementById("ime").value.trim();
  const priimek = document.getElementById("priimek").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!ime || !priimek) {
    alert("Prosim, vnesi ime in priimek.");
    return;
  }

  const payload = {
    customer: { ime, priimek, email },
    items: izdelkiVKosarici,
    total: parseFloat(skupajZnesek.textContent.replace(" €", "")),
    created_at: new Date().toISOString()
  };

  try {
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Napaka pri pošiljanju naročila.");

    const data = await res.json();
    alert("Naročilo uspešno oddano! Št. naročila: " + data.orderId);

    // počisti košarico in zapri modal
    izdelkiVKosarici = [];
    posodobiKosarico();
    orderModal.classList.remove("prikazano");
    overlay.classList.remove("prikazano");

  } catch (err) {
    console.error(err);
    alert("Pri oddaji je prišlo do napake. Poskusi ponovno kasneje.");
  }
});