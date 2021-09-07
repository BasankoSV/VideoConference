const planSwitcher = document.querySelector('.plan-switcher')

planSwitcher.addEventListener('click', e => {
  e.preventDefault()
  if (e.target.tagName === "BUTTON") {
    const buttons = planSwitcher.children
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove('switch-on')
    }
    e.target.classList.add('switch-on')
  }
})