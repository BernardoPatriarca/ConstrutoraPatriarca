// Inicializa o AOS assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    // Máscara para telefone
    $('#telefone').inputmask('(99) 99999-9999');
});

// Funções de scroll
window.addEventListener('scroll', function() {
    // Navbar scroll
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Back to top button
    const backToTop = document.querySelector('.back-to-top');
    if (window.scrollY > 300) {
        backToTop.classList.add('active');
    } else {
        backToTop.classList.remove('active');
    }

    // Ativa links da navbar conforme scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (pageYOffset >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Smooth scroll para links âncora
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
            });

            // Fecha o menu mobile se estiver aberto
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                bsCollapse.hide();
            }
        }
    });
});

// Função para criar confetti
function createConfetti() {
    const colors = ['#D4AF37', '#E8D9A0', '#FFFFFF', '#8B0000', '#B22222'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Configurações do Supabase
const supabaseUrl = 'https://flrprpaswimtggikhbfv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscnBycGFzd2ltdGdnaWtoYmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNjU1MzIsImV4cCI6MjA1OTY0MTUzMn0.KIlghqbZMcU-nbEFO7hC8jTPfeb0A1MLJv2so5Gs2ho';

// Funções auxiliares
function formatarData(data) {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'concluído':
            return 'status-completed';
        case 'em andamento':
            return 'status-ongoing';
        case 'planejamento':
            return 'status-planning';
        default:
            return '';
    }
}

// Funções para carregar dados do Supabase
async function getProjectImageUrl(supabaseClient, projectId) {
    try {
        const { data: gallery, error } = await supabaseClient
            .from('galeria_fotos')
            .select('foto_url')
            .eq('projeto_id', projectId)
            .order('ordem_exibicao', { ascending: true })
            .limit(1);

        if (error) throw error;
        return gallery[0]?.foto_url || 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
    } catch (error) {
        console.error('Erro ao buscar imagem do projeto:', error);
        return 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
    }
}

async function loadTeamMembers(supabaseClient) {
    try {
        const { data: teamMembers, error } = await supabaseClient
            .from('funcionarios')
            .select('*')
            .eq('ativo', true) 
            .order('ordem_exibicao', { ascending: true });
        if (error) throw error;
        return teamMembers;
    } catch (error) {
        console.error('Erro ao carregar membros da equipe:', error);
        return null;
    }
}

async function loadGalleryPhotos(supabaseClient) {
    try {
        const { data: photos, error } = await supabaseClient
            .from('galeria_fotos')
            .select('*')
            .order('ordem_exibicao', { ascending: true });

        if (error) throw error;
        return photos;
    } catch (error) {
        console.error('Erro ao carregar fotos da galeria:', error);
        return null;
    }
}

async function loadProjectsWithImages(supabaseClient) {
    try {
        const { data: projects, error: projectsError } = await supabaseClient
            .from('projetos')
            .select('*')
            .order('data_conclusao', { ascending: false });

        if (projectsError) throw projectsError;
        if (!projects || projects.length === 0) return [];

        const projectsWithImages = [];

        for (const project of projects) {
            try {
                const imageUrl = await getProjectImageUrl(supabaseClient, project.id);
                projectsWithImages.push({ ...project, imageUrl });
            } catch (error) {
                console.error(`Erro ao carregar imagem para projeto ${project.id}:`, error);
                projectsWithImages.push({
                    ...project,
                    imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
                });
            }
        }

        return projectsWithImages;
    } catch (error) {
        console.error('Erro ao carregar projetos com imagens:', error);
        return null;
    }
}

// Funções de renderização
function renderTeamMembers(teamMembers) {
    const container = document.getElementById('team-container');

    if (!teamMembers || teamMembers.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Nossa equipe está em formação. Volte em breve!</p></div>';
        return;
    }

    let html = '';
    let delay = 100;

    teamMembers.forEach((member) => {
        html += `
            <div class="col-md-6 col-lg-3 mb-4" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="team-card">
                    <img src="${member.foto_url || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80'}"
                        class="team-img" alt="${member.nome}">
                    <h4 class="team-name">${member.nome}</h4>
                    <p class="team-position" style="color: #333 !important;">${member.cargo} - ${member.departamento}</p>
                    <p class="team-bio" style="color: #555 !important;">${member.bio || 'Profissional dedicado e comprometido com a excelência.'}</p>
                </div>
            </div>
        `;
        delay += 100;
    });

    container.innerHTML = html;
}

function renderGalleryPhotos(photos) {
    const container = document.getElementById('gallery-container');

    if (!photos || photos.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Nenhuma foto disponível na galeria.</p></div>';
        return;
    }

    const limitedPhotos = photos.slice(0, 3);
    let html = '';
    let delay = 100;

    limitedPhotos.forEach((photo) => {
        html += `
            <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="gallery-container">
                    <img src="${photo.foto_url}" class="gallery-img" alt="${photo.descricao || 'Foto da galeria'}">
                    <div class="gallery-overlay">
                        <h5 class="gallery-title">${photo.descricao || 'Projeto'}</h5>
                        <p class="gallery-desc">${photo.descricao || 'Imagem do nosso portfólio'}</p>
                    </div>
                </div>
            </div>
        `;
        delay += 100;
    });

    container.innerHTML = html;
}

function renderAllGalleryPhotos(photos) {
    const container = document.getElementById('all-projects-container');

    if (!photos || photos.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Nenhuma foto disponível na galeria.</p></div>';
        return;
    }

    let html = '';

    photos.forEach((photo) => {
        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="gallery-container" style="height: 280px;">
                    <img src="${photo.foto_url}" class="gallery-img" alt="${photo.descricao || 'Foto da galeria'}">
                    <div class="gallery-overlay">
                        <h5 class="gallery-title">${photo.descricao || 'Projeto'}</h5>
                        <p class="gallery-desc">${photo.descricao || 'Imagem do nosso portfólio'}</p>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderMainProjects(projectsWithImages) {
    const container = document.getElementById('projects-container');

    if (!projectsWithImages || projectsWithImages.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Nenhum projeto encontrado.</p></div>';
        return;
    }

    const limitedProjects = projectsWithImages.slice(0, 3);
    let html = '';
    let delay = 100;

    limitedProjects.forEach((project) => {
        html += `
            <div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="card">
                    ${project.destaque ? '<span class="badge-destaque">Destaque</span>' : ''}
                    <img src="${project.imageUrl}"
                        class="card-img-top" alt="${project.titulo || 'Projeto'}">
                    <div class="card-body">
                        <h5 class="card-title">${project.titulo || 'Projeto'}</h5>
                        <span class="project-status ${getStatusClass(project.status)}">${project.status || 'Sem status'}</span>
                        <p class="card-text">${project.descricao || 'Descrição não disponível'}</p>
                        <div class="project-details">
                            <div class="project-detail">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>Localização</span>
                                <strong>${project.localizacao || 'Não informado'}</strong>
                            </div>
                            <div class="project-detail">
                                <i class="fas fa-ruler-combined"></i>
                                <span>Área</span>
                                <strong>${project.area_construida ? project.area_construida.toLocaleString('pt-BR') + 'm²' : 'Não informado'}</strong>
                            </div>
                            <div class="project-detail">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${project.status === 'Concluído' ? 'Ano' : 'Previsão'}</span>
                                <strong>${formatarData(project.data_conclusao) || 'Não informado'}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        delay += 100;
    });

    container.innerHTML = html;
}

function renderAllProjects(projectsWithImages) {
    const container = document.getElementById('all-projects-container');

    if (!projectsWithImages || projectsWithImages.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Nenhum projeto encontrado.</p></div>';
        return;
    }

    let html = '';

    projectsWithImages.forEach((project) => {
        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    ${project.destaque ? '<span class="badge-destaque">Destaque</span>' : ''}
                    <img src="${project.imageUrl}"
                        class="card-img-top" alt="${project.titulo || 'Projeto'}">
                    <div class="card-body">
                        <h5 class="card-title">${project.titulo || 'Projeto'}</h5>
                        <span class="project-status ${getStatusClass(project.status)}">${project.status || 'Sem status'}</span>
                        <p class="card-text">${project.descricao || 'Descrição não disponível'}</p>
                        <div class="project-details">
                            <div class="project-detail">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>Localização</span>
                                <strong>${project.localizacao || 'Não informado'}</strong>
                            </div>
                            <div class="project-detail">
                                <i class="fas fa-ruler-combined"></i>
                                <span>Área</span>
                                <strong>${project.area_construida ? project.area_construida.toLocaleString('pt-BR') + 'm²' : 'Não informado'}</strong>
                            </div>
                            <div class="project-detail">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${project.status === 'Concluído' ? 'Ano' : 'Previsão'}</span>
                                <strong>${formatarData(project.data_conclusao) || 'Não informado'}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Configuração dos botões "Ver todos"
function setupViewAllGalleryButton(photos) {
    const viewAllBtn = document.querySelector('#gallery .btn-gold');
    if (viewAllBtn && photos) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            renderAllGalleryPhotos(photos);
            document.getElementById('allProjectsModalLabel').textContent = 'Galeria Completa de Fotos';
            $('#allProjectsModal').modal('show');
        });
    }
}

function setupViewAllButton(projectsWithImages) {
    const viewAllBtn = document.querySelector('.btn-gold[href="#"]');
    if (viewAllBtn && projectsWithImages) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            renderAllProjects(projectsWithImages);
            $('#allProjectsModal').modal('show');
        });
    }
}

// Evento para limpar o modal quando fechado
document.getElementById('allProjectsModal').addEventListener('hidden.bs.modal', function() {
    document.getElementById('all-projects-container').innerHTML = '';
    document.getElementById('allProjectsModalLabel').textContent = 'Todos os Nossos Projetos';
});

// Função principal de inicialização
async function initializeApp() {
    try {
        console.log('Iniciando aplicação...');

        // Verifica se o Supabase está carregado
        if (typeof supabase === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = async function() {
                await initializeSupabase();
            };
            document.head.appendChild(script);
        } else {
            await initializeSupabase();
        }

    } catch (error) {
        console.error('Erro na inicialização:', error);
        const projectsContainer = document.getElementById('projects-container');
        if (projectsContainer) {
            projectsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">Erro ao carregar conteúdo. Por favor, verifique sua conexão e tente novamente.</p>
                </div>
            `;
        }
    }
}

async function initializeSupabase() {
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // Carrega e renderiza projetos
    const projectsWithImages = await loadProjectsWithImages(supabaseClient);
    if (projectsWithImages) {
        await renderMainProjects(projectsWithImages);
        setupViewAllButton(projectsWithImages);
    }

    // Carrega e renderiza galeria de fotos
    const galleryPhotos = await loadGalleryPhotos(supabaseClient);
    if (galleryPhotos) {
        renderGalleryPhotos(galleryPhotos);
        setupViewAllGalleryButton(galleryPhotos);
    }

    // Carrega e renderiza membros da equipe
    const teamMembers = await loadTeamMembers(supabaseClient);
    if (teamMembers) {
        renderTeamMembers(teamMembers);
    }

    // Configura o botão principal (se existir)
    const mainButton = document.getElementById('mainButton');
    if (mainButton) {
        mainButton.addEventListener('click', createConfetti);
    }
}

// Função para enviar mensagem para o banco de dados
async function sendMessageToDatabase(supabaseClient, formData) {
    try {
        const { data, error } = await supabaseClient
            .from('contatos')
            .insert([{
                nome: formData.nome,
                email: formData.email,
                telefone: formData.telefone,
                assunto: formData.assunto,
                mensagem: formData.mensagem,
                tipo_solicitacao: formData.assunto,
                status: 'Em andamento',
                origem: 'Site'
            }]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
    }
}

// Configuração do formulário de contato
document.getElementById('contactForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const originalBtnClass = submitBtn.className;

    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        assunto: document.getElementById('assunto').value,
        mensagem: document.getElementById('mensagem').value
    };

    // Validação dos campos
    if (!formData.nome || !formData.email || !formData.telefone || !formData.assunto || !formData.mensagem) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
    submitBtn.disabled = true;
    submitBtn.className = originalBtnClass + ' disabled';

    try {
        const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        await sendMessageToDatabase(supabaseClient, formData);

        submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Mensagem Enviada!';
        submitBtn.className = originalBtnClass.replace('btn-submit', 'btn-success');
        createConfetti();

        setTimeout(() => {
            this.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.className = originalBtnClass;
            submitBtn.disabled = false;
        }, 3000);

    } catch (error) {
        submitBtn.innerHTML = '<i class="fas fa-times me-2"></i>Erro ao Enviar';
        submitBtn.className = originalBtnClass.replace('btn-submit', 'btn-danger');

        console.error('Erro no envio:', error);
        alert('Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.');

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.className = originalBtnClass;
            submitBtn.disabled = false;
        }, 3000);
    }
});

// Inicializa a aplicação quando o DOM estiver pronto
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeApp, 1);
} else {
    document.addEventListener('DOMContentLoaded', initializeApp);
}