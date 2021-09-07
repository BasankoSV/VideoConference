const PRICE = {
  annually: {
    basic: ['No', ''],
    pro: ['$499', '/year'],
    business: ['$999', '/year']
  },
  monthly: {
    basic: ['Free', ''],
    pro: ['$49', '/mo'],
    business: ['$99', '/mo']
  }
}

const planSwitcher = document.querySelector('.plan-switcher')
const prices = document.querySelectorAll('.price')

planSwitcher.addEventListener('click', event => {
  event.preventDefault()
  let target = event.target
  if (target.tagName === "BUTTON") {
    const buttons = planSwitcher.children
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove('switch-on')
    }
    target.classList.add('switch-on')
    let period = target.textContent.toLowerCase()
    for (const price of prices) {
      let type = price.dataset.priceType
      price.innerHTML = `${PRICE[period][type][0]}<span>${PRICE[period][type][1]}</span>`
    }
  }
})