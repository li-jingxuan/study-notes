// console.log(document.getElementById('div1'))

window.onload = () => {
  console.log(document.getElementById('div1'))
  const doms = document.getElementsByClassName('divbox')
  for(let i=0; i < doms.length; i++) {
    doms[i].onclick = e => {
      window.scrollTo({
        top: e.target.nextElementSibling.offsetTop,
        behavior: "smooth"
      });
      console.log(e.target.nextElementSibling.offsetTop,e.target)
    }
  }
}