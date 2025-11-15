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

    li.querySelector(".plus").addEventListener("click", () => {
      izdelek.kolicina++;
      posodobiKosarico();
    });
    li.querySelector(".minus").addEventListener("click", () => {
      if (izdelek.kolicina > 1) izdelek.kolicina--;
      else izdelkiVKosarici = izdelkiVKosarici.filter((i) => i.ime !== izdelek.ime);
      posodobiKosarico();
    });
    li.querySelector(".odstrani").addEventListener("click", () => {
      izdelkiVKosarici = izdelkiVKosarici.filter((i) => i.ime !== izdelek.ime);
      posodobiKosarico();
    });
  });

  skupajZnesek.textContent = skupaj.toFixed(2) + " €";
}

// dodajanje izdelkov v košarico
gumbi.forEach((gumb) => {
  gumb.addEventListener("click", () => {
    const naslov = gumb.parentElement.querySelector("h3").textContent;
    const [imeIzdelka, cenaBesedilo] = naslov.split(" - ");
    const ime = imeIzdelka.trim();
    const cena = parseFloat(cenaBesedilo) || 0;

    const obstojeci = izdelkiVKosarici.find((i) => i.ime === ime);
    if (obstojeci) obstojeci.kolicina++;
    else izdelkiVKosarici.push({ ime, cena, kolicina: 1 });

    posodobiKosarico();
  });
});

// burger + overlay
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
burger?.addEventListener("click", odpriKosarico);
overlay?.addEventListener("click", zapriKosarico);
closeCartBtn?.addEventListener("click", zapriKosarico);

// modal za obrazec
const orderModal = document.getElementById("order-modal");
const orderForm = document.getElementById("order-form");
const cancelOrder = document.getElementById("cancel-order");

oddajBtn.addEventListener("click", () => {
  if (izdelkiVKosarici.length === 0) {
    alert("Košarica je prazna — dodaj izdelke.");
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

  // === POŠLJI NA SERVER ===
  const response = await fetch("/api/narocilo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ime,
      priimek,
      email,
      izdelki: izdelkiVKosarici,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    alert("Napaka pri shranjevanju naročila.");
    return;
  }

  alert(`Naročilo oddano! Hvala, ${ime} ${priimek}`);

  // počisti košarico
  izdelkiVKosarici = [];
  posodobiKosarico();

  // zapri modal
  orderModal.classList.remove("prikazano");
  overlay.classList.remove("prikazano");
});