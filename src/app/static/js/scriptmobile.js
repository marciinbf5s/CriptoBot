// scriptmobile.js - Controle do menu hamburguer mobile

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('menuHamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileMenuOverlay');

  if (!btn || !sidebar || !overlay) return;

  function openMenu() {
    sidebar.classList.add('mobile-menu', 'open');
    overlay.classList.add('active');
    btn.classList.add('open');
    sidebar.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    btn.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { sidebar.style.display = 'none'; }, 300);
  }

  btn.addEventListener('click', function() {
    if (!sidebar.classList.contains('open')) openMenu();
    else closeMenu();
  });
  overlay.addEventListener('click', closeMenu);

  // Fecha o menu ao navegar por links do menu
  sidebar.querySelectorAll('.btn, a').forEach(el => {
    el.addEventListener('click', closeMenu);
  });

  // Garante que o sidebar comece oculto no mobile
  if (window.innerWidth <= 768) {
    sidebar.style.display = 'none';
  }
});
