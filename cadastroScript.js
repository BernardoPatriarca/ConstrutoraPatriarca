const SUPABASE_URL = 'https://flrprpaswimtggikhbfv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscnBycGFzd2ltdGdnaWtoYmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNjU1MzIsImV4cCI6MjA1OTY0MTUzMn0.KIlghqbZMcU-nbEFO7hC8jTPfeb0A1MLJv2so5Gs2ho';

const AdminPanel = {
    supabase: null,

    data: {
        projetos: [],
        galeria: [],
        funcionarios: [],
        contatos: []
    },

    elements: {
        tables: {
            projetos: null,
            galeria: null,
            funcionarios: null,
            contatos: null
        },
        counters: {
            projetos: null,
            funcionarios: null,
            contatos: null
        },
        toasts: {
            success: null,
            error: null
        }
    },

    init: async function () {
        try {
            this.initToasts();
            this.initDataTables();
            this.setupSidebar();
            this.setupEventHandlers();

            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            const { data, error } = await this.supabase
                .from('projetos')
                .select('*')
                .limit(1);

            if (error) throw error;

            await this.loadData();

            console.log('Painel administrativo inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar o painel:', error);
            this.showErrorToast('Erro ao conectar com o banco de dados');
        }
    },

    initToasts: function () {
        this.elements.toasts.success = new bootstrap.Toast(document.getElementById('successToast'));
        this.elements.toasts.error = new bootstrap.Toast(document.getElementById('errorToast'));
    },

    showSuccessToast: function (message) {
        $('#successToastMessage').text(message);
        this.elements.toasts.success.show();
    },

    showErrorToast: function (message) {
        $('#errorToastMessage').text(message);
        this.elements.toasts.error.show();
    },

    setupSidebar: function () {
        $('#sidebarCollapse').on('click', function () {
            $('.sidebar').toggleClass('active');
            $('.content').toggleClass('active');
        });

        $('a[href^="#"]').on('click', function (e) {
            e.preventDefault();
            const target = $(this).attr('href');
            $('html, body').animate({
                scrollTop: $(target).offset().top - 20
            }, 500);
        });
    },

    initDataTables: function () {
        const portugueseTranslation = {
            "decimal": "",
            "emptyTable": "Nenhum dado disponível na tabela",
            "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
            "infoEmpty": "Mostrando 0 a 0 de 0 registros",
            "infoFiltered": "(filtrado de _MAX_ registros no total)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Mostrar _MENU_ registros",
            "loadingRecords": "Carregando...",
            "processing": "Processando...",
            "search": "Pesquisar:",
            "zeroRecords": "Nenhum registro correspondente encontrado",
            "paginate": {
                "first": "Primeiro",
                "last": "Último",
                "next": "Próximo",
                "previous": "Anterior"
            },
            "aria": {
                "sortAscending": ": ativar para ordenar coluna ascendente",
                "sortDescending": ": ativar para ordenar coluna descendente"
            }
        };

        this.elements.tables.projetos = $('#projetosTable').DataTable({
            responsive: true,
            language: portugueseTranslation,
            autoWidth: false,
            columnDefs: [
                { width: '50px', targets: 0 },
                { width: '120px', targets: 1 },
                { width: '150px', targets: 6 }
            ]
        });

        this.elements.tables.galeria = $('#galeriaTable').DataTable({
            responsive: true,
            language: portugueseTranslation,
            autoWidth: false,
            columnDefs: [
                { width: '50px', targets: 0 },
                { width: '120px', targets: 1 },
                { width: '150px', targets: 5 }
            ]
        });

        this.elements.tables.funcionarios = $('#funcionariosTable').DataTable({
            responsive: true,
            language: portugueseTranslation,
            autoWidth: false,
            columnDefs: [
                { width: '50px', targets: 0 },
                { width: '120px', targets: 1 },
                { width: '150px', targets: 6 }
            ]
        });

        this.elements.tables.contatos = $('#contatosTable').DataTable({
            responsive: true,
            language: portugueseTranslation,
            autoWidth: false,
            columnDefs: [
                { width: '50px', targets: 0 },
                { width: '150px', targets: 6 }
            ]
        });

        this.elements.counters.projetos = $('#projetos-count');
        this.elements.counters.funcionarios = $('#funcionarios-count');
        this.elements.counters.contatos = $('#contatos-count');
    },

    loadData: async function () {
        try {
            const [projetos, galeria, funcionarios, contatos] = await Promise.all([
                this.supabase.from('projetos').select('*').order('data_inicio', { ascending: false }),
                this.supabase.from('galeria_fotos').select('*').order('data_upload', { ascending: false }),
                this.supabase.from('funcionarios').select('*').order('nome', { ascending: true }),
                this.supabase.from('contatos').select('*').order('data_contato', { ascending: false })
            ]);

            if (projetos.error) throw projetos.error;
            if (galeria.error) throw galeria.error;
            if (funcionarios.error) throw funcionarios.error;
            if (contatos.error) throw contatos.error;

            this.data.projetos = projetos.data || [];
            this.data.galeria = galeria.data || [];
            this.data.funcionarios = funcionarios.data || [];
            this.data.contatos = contatos.data || [];

            this.updateTables();
            this.updateCounters();

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showErrorToast('Erro ao carregar dados do banco de dados');
        }
    },

    updateTables: function () {
        this.updateProjetosTable();
        this.updateGaleriaTable();
        this.updateFuncionariosTable();
        this.updateContatosTable();
    },

    updateProjetosTable: function () {
        const table = this.elements.tables.projetos;
        table.clear();

        this.data.projetos.forEach(projeto => {
            const imgTag = this.getFirstProjectImage(projeto.id) || '<i class="fas fa-building fa-2x text-muted"></i>';

            const statusBadge = this.getStatusBadge(projeto.status);
            const destaqueBadge = projeto.destaque
                ? '<span class="badge bg-warning">Destaque</span>'
                : '<span class="badge bg-secondary">Normal</span>';

            table.row.add([
                projeto.id,
                imgTag,
                projeto.titulo || '-',
                projeto.localizacao || '-',
                statusBadge,
                destaqueBadge,
                this.createActionButtons('projeto', projeto.id)
            ]);
        });

        table.draw();
    },

    getFirstProjectImage: function (projetoId) {
        const foto = this.data.galeria.find(f => f.projeto_id === projetoId);
        if (foto) {
            return `<img src="${foto.foto_url}" class="img-thumbnail" alt="Projeto ${projetoId}" style="max-width: 100px;">`;
        }
        return null;
    },

    getStatusBadge: function (status) {
        switch (status) {
            case 'Em andamento': return '<span class="badge bg-primary">Em andamento</span>';
            case 'Concluído': return '<span class="badge bg-success">Concluído</span>';
            case 'Suspenso': return '<span class="badge bg-danger">Suspenso</span>';
            default: return '<span class="badge bg-secondary">Em planejamento</span>';
        }
    },

    updateGaleriaTable: function () {
        const table = this.elements.tables.galeria;
        table.clear();

        this.data.galeria.forEach(foto => {
            const projeto = this.data.projetos.find(p => p.id === foto.projeto_id);
            const projetoNome = projeto ? projeto.titulo : 'Projeto não encontrado';

            const imgTag = foto.foto_url
                ? `<img src="${foto.foto_url}" class="img-thumbnail" alt="Foto ${foto.id}" style="max-width: 100px;">`
                : '<i class="fas fa-image fa-2x text-muted"></i>';

            const capaBadge = foto.capa
                ? '<span class="badge bg-success">Sim</span>'
                : '<span class="badge bg-secondary">Não</span>';

            table.row.add([
                foto.id,
                imgTag,
                projetoNome,
                foto.descricao ? (foto.descricao.length > 50 ? foto.descricao.substring(0, 50) + '...' : foto.descricao) : '-',
                capaBadge,
                this.createActionButtons('foto', foto.id)
            ]);
        });

        table.draw();
    },

    updateFuncionariosTable: function () {
        const table = this.elements.tables.funcionarios;
        table.clear();

        this.data.funcionarios.forEach(funcionario => {
            const imgTag = funcionario.foto_url
                ? `<img src="${funcionario.foto_url}" class="img-thumbnail" alt="${funcionario.nome}" style="max-width: 100px;">`
                : '<i class="fas fa-user-circle fa-2x text-muted"></i>';

            const statusBadge = funcionario.ativo
                ? '<span class="badge bg-success">Ativo</span>'
                : '<span class="badge bg-danger">Inativo</span>';

            table.row.add([
                funcionario.id,
                imgTag,
                funcionario.nome || '-',
                funcionario.cargo || '-',
                funcionario.departamento || '-',
                statusBadge,
                this.createActionButtons('funcionario', funcionario.id)
            ]);
        });

        table.draw();
    },

    updateContatosTable: function () {
        const table = this.elements.tables.contatos;
        table.clear();

        this.data.contatos.forEach(contato => {
            const contatoInfo = contato.email
                ? `${contato.email}${contato.telefone ? '<br>' + contato.telefone : ''}`
                : contato.telefone || '-';

            const statusBadge = this.getContatoStatusBadge(contato.status);

            table.row.add([
                contato.id,
                contato.nome || '-',
                contatoInfo,
                contato.assunto || '-',
                this.formatDateTime(contato.data_contato),
                statusBadge,
                this.createActionButtons('contato', contato.id)
            ]);
        });

        table.draw();
    },

    getContatoStatusBadge: function (status) {
        switch (status) {
            case 'Respondido': return '<span class="badge bg-success">Respondido</span>';
            case 'Em andamento': return '<span class="badge bg-primary">Em andamento</span>';
            default: return '<span class="badge bg-secondary">Não respondido</span>';
        }
    },

    createActionButtons: function (type, id) {
        return `
            <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-primary edit-${type}" data-id="${id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-item" data-type="${type}" data-id="${id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    },

    updateCounters: function () {
        this.elements.counters.projetos.text(this.data.projetos.filter(p => p.status === 'Em andamento').length);
        this.elements.counters.funcionarios.text(this.data.funcionarios.filter(f => f.ativo).length);
        this.elements.counters.contatos.text(this.data.contatos.length);
    },

    setupEventHandlers: function () {
        this.setupAddButtons();
        this.setupEditButtons();
        this.setupDeleteButtons();
        this.setupSaveButtons();
        this.setupUrlPreviews();
    },

    setupAddButtons: function () {
        $('#addProjetoBtn').on('click', () => {
            $('#projetoModalTitle').text('Adicionar Projeto');
            $('#projetoForm')[0].reset();
            $('#projetoId').val('');
            $('#projetoModal').modal('show');
        });

        $('#addFotoBtn').on('click', async () => {
            $('#fotoModalTitle').text('Adicionar Foto');
            $('#fotoForm')[0].reset();
            $('#fotoId').val('');
            $('#fotoImagemUrl').val('');
            $('#fotoImagemPreview').attr('src', '').removeClass('show');

            const select = $('#fotoProjeto');
            select.empty().append('<option value="">Selecione um projeto...</option>');

            this.data.projetos.forEach(projeto => {
                select.append(`<option value="${projeto.id}">${projeto.titulo}</option>`);
            });

            $('#fotoModal').modal('show');
        });

        $('#addFuncionarioBtn').on('click', () => {
            $('#funcionarioModalTitle').text('Adicionar Funcionário');
            $('#funcionarioForm')[0].reset();
            $('#funcionarioId').val('');
            $('#funcionarioFotoUrl').val('');
            $('#funcionarioFotoPreview').attr('src', '').removeClass('show');
            $('#funcionarioModal').modal('show');
        });
    },

    setupEditButtons: function () {
        $(document).on('click', '.edit-projeto', async (e) => {
            const id = $(e.currentTarget).data('id');

            try {
                const { data: projeto, error } = await this.supabase
                    .from('projetos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (projeto) {
                    $('#projetoModalTitle').text('Editar Projeto');
                    $('#projetoId').val(projeto.id);
                    $('#projetoTitulo').val(projeto.titulo);
                    $('#projetoDescricao').val(projeto.descricao);
                    $('#projetoLocalizacao').val(projeto.localizacao);
                    $('#projetoDataInicio').val(projeto.data_inicio);
                    $('#projetoDataConclusao').val(projeto.data_conclusao);
                    $('#projetoArea').val(projeto.area_construida);
                    $('#projetoValor').val(projeto.valor_contrato);
                    $('#projetoStatus').val(projeto.status);
                    $('#projetoDestaque').prop('checked', projeto.destaque);

                    $('#projetoModal').modal('show');
                }
            } catch (error) {
                console.error('Erro ao carregar projeto:', error);
                this.showErrorToast('Erro ao carregar dados do projeto');
            }
        });

        $(document).on('click', '.edit-foto', async (e) => {
            const id = $(e.currentTarget).data('id');

            try {
                const { data: foto, error } = await this.supabase
                    .from('galeria_fotos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (foto) {
                    $('#fotoModalTitle').text('Editar Foto');
                    $('#fotoId').val(foto.id);
                    $('#fotoDescricao').val(foto.descricao);
                    $('#fotoOrdem').val(foto.ordem_exibicao);
                    $('#fotoCapa').prop('checked', foto.capa);
                    $('#fotoImagemUrl').val(foto.foto_url || '');

                    const select = $('#fotoProjeto');
                    select.empty().append('<option value="">Selecione um projeto...</option>');

                    this.data.projetos.forEach(projeto => {
                        select.append(`<option value="${projeto.id}" ${projeto.id === foto.projeto_id ? 'selected' : ''}>${projeto.titulo}</option>`);
                    });

                    if (foto.foto_url) {
                        $('#fotoImagemPreview').attr('src', foto.foto_url).addClass('show');
                    } else {
                        $('#fotoImagemPreview').attr('src', '').removeClass('show');
                    }

                    $('#fotoModal').modal('show');
                }
            } catch (error) {
                console.error('Erro ao carregar foto:', error);
                this.showErrorToast('Erro ao carregar dados da foto');
            }
        });

        $(document).on('click', '.edit-funcionario', async (e) => {
            const id = $(e.currentTarget).data('id');

            try {
                const { data: funcionario, error } = await this.supabase
                    .from('funcionarios')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (funcionario) {
                    $('#funcionarioModalTitle').text('Editar Funcionário');
                    $('#funcionarioId').val(funcionario.id);
                    $('#funcionarioNome').val(funcionario.nome);
                    $('#funcionarioCargo').val(funcionario.cargo);
                    $('#funcionarioDepartamento').val(funcionario.departamento);
                    $('#funcionarioFotoUrl').val(funcionario.foto_url || '');
                    $('#funcionarioDataContratacao').val(funcionario.data_contratacao);
                    $('#funcionarioBio').val(funcionario.bio);
                    $('#funcionarioAtivo').prop('checked', funcionario.ativo);

                    if (funcionario.foto_url) {
                        $('#funcionarioFotoPreview').attr('src', funcionario.foto_url).addClass('show');
                    } else {
                        $('#funcionarioFotoPreview').attr('src', '').removeClass('show');
                    }

                    $('#funcionarioModal').modal('show');
                }
            } catch (error) {
                console.error('Erro ao carregar funcionário:', error);
                this.showErrorToast('Erro ao carregar dados do funcionário');
            }
        });

        $(document).on('click', '.edit-contato', async (e) => {
            const id = $(e.currentTarget).data('id');

            try {
                const { data: contato, error } = await this.supabase
                    .from('contatos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (contato) {
                    const { error: updateError } = await this.supabase
                        .from('contatos')
                        .update({ status: 'Respondido' })
                        .eq('id', id);

                    if (updateError) throw updateError;

                    await this.loadData();
                    this.showSuccessToast('Contato marcado como respondido!');
                }
            } catch (error) {
                console.error('Erro ao atualizar contato:', error);
                this.showErrorToast('Erro ao atualizar contato');
            }
        });
    },

    // Configura botões de exclusão
    setupDeleteButtons: function () {
        $(document).on('click', '.delete-item', (e) => {
            const id = $(e.currentTarget).data('id');
            const type = $(e.currentTarget).data('type');

            $('#itemToDeleteId').val(id);
            $('#itemToDeleteType').val(type);
            $('#confirmModal').modal('show');
        });

        $('#confirmDeleteBtn').on('click', async () => {
            const id = $('#itemToDeleteId').val();
            const type = $('#itemToDeleteType').val();

            try {
                let error;
                let successMessage = '';

                if (type === 'projeto') {
                    const { data: fotos, error: fotosError } = await this.supabase
                        .from('galeria_fotos')
                        .select('id')
                        .eq('projeto_id', id);

                    if (fotosError) throw fotosError;

                    if (fotos.length > 0) {
                        this.showErrorToast('Não é possível excluir um projeto com fotos associadas!');
                        $('#confirmModal').modal('hide');
                        return;
                    }

                    const { error: deleteError } = await this.supabase
                        .from('projetos')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    successMessage = 'Projeto excluído com sucesso!';
                } else if (type === 'foto') {
                    const { error: deleteError } = await this.supabase
                        .from('galeria_fotos')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    successMessage = 'Foto excluída com sucesso!';
                } else if (type === 'funcionario') {
                    const { error: deleteError } = await this.supabase
                        .from('funcionarios')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    successMessage = 'Funcionário excluído com sucesso!';
                } else if (type === 'contato') {
                    const { error: deleteError } = await this.supabase
                        .from('contatos')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    successMessage = 'Contato excluído com sucesso!';
                }

                if (error) throw error;

                await this.loadData();
                $('#confirmModal').modal('hide');
                this.showSuccessToast(successMessage);

            } catch (error) {
                console.error('Erro ao excluir:', error);
                this.showErrorToast('Erro ao excluir item');
            }
        });
    },

    setupSaveButtons: function () {
        $('#saveProjetoBtn').on('click', async () => {
            const id = $('#projetoId').val();
            const projetoData = {
                titulo: $('#projetoTitulo').val(),
                descricao: $('#projetoDescricao').val(),
                localizacao: $('#projetoLocalizacao').val(),
                data_inicio: $('#projetoDataInicio').val(),
                data_conclusao: $('#projetoDataConclusao').val(),
                area_construida: $('#projetoArea').val(),
                valor_contrato: $('#projetoValor').val(),
                status: $('#projetoStatus').val(),
                destaque: $('#projetoDestaque').is(':checked')
            };

            if (!projetoData.titulo || !projetoData.localizacao) {
                this.showErrorToast('Preencha todos os campos obrigatórios!');
                return;
            }

            try {
                let error;

                if (id) {
                    const { error: updateError } = await this.supabase
                        .from('projetos')
                        .update(projetoData)
                        .eq('id', id);
                    error = updateError;
                } else {
                    const { error: insertError } = await this.supabase
                        .from('projetos')
                        .insert(projetoData);
                    error = insertError;
                }

                if (error) throw error;

                await this.loadData();
                $('#projetoModal').modal('hide');
                this.showSuccessToast(id ? 'Projeto atualizado com sucesso!' : 'Projeto adicionado com sucesso!');

            } catch (error) {
                console.error('Erro ao salvar projeto:', error);
                this.showErrorToast('Erro ao salvar projeto');
            }
        });

        $('#saveFotoBtn').on('click', async () => {
            const id = $('#fotoId').val();
            const fotoData = {
                projeto_id: $('#fotoProjeto').val(),
                descricao: $('#fotoDescricao').val(),
                foto_url: $('#fotoImagemUrl').val(),
                ordem_exibicao: $('#fotoOrdem').val(),
                capa: $('#fotoCapa').is(':checked')
            };

            if (!fotoData.projeto_id || !fotoData.foto_url) {
                this.showErrorToast('Preencha todos os campos obrigatórios!');
                return;
            }

            try {
                let error;

                if (id) {
                    const { error: updateError } = await this.supabase
                        .from('galeria_fotos')
                        .update(fotoData)
                        .eq('id', id);
                    error = updateError;
                } else {
                    fotoData.data_upload = new Date().toISOString();
                    const { error: insertError } = await this.supabase
                        .from('galeria_fotos')
                        .insert(fotoData);
                    error = insertError;
                }

                if (error) throw error;

                await this.loadData();
                $('#fotoModal').modal('hide');
                this.showSuccessToast(id ? 'Foto atualizada com sucesso!' : 'Foto adicionada com sucesso!');

            } catch (error) {
                console.error('Erro ao salvar foto:', error);
                this.showErrorToast('Erro ao salvar foto');
            }
        });

        $('#saveFuncionarioBtn').on('click', async () => {
            const id = $('#funcionarioId').val();
            const funcionarioData = {
                nome: $('#funcionarioNome').val(),
                cargo: $('#funcionarioCargo').val(),
                departamento: $('#funcionarioDepartamento').val(),
                foto_url: $('#funcionarioFotoUrl').val(),
                data_contratacao: $('#funcionarioDataContratacao').val(),
                bio: $('#funcionarioBio').val(),
                ativo: $('#funcionarioAtivo').is(':checked')
            };

            if (!funcionarioData.nome || !funcionarioData.cargo || !funcionarioData.departamento) {
                this.showErrorToast('Preencha todos os campos obrigatórios!');
                return;
            }

            try {
                let error;

                if (id) {
                    const { error: updateError } = await this.supabase
                        .from('funcionarios')
                        .update(funcionarioData)
                        .eq('id', id);
                    error = updateError;
                } else {
                    const { error: insertError } = await this.supabase
                        .from('funcionarios')
                        .insert(funcionarioData);
                    error = insertError;
                }

                if (error) throw error;

                await this.loadData();
                $('#funcionarioModal').modal('hide');
                this.showSuccessToast(id ? 'Funcionário atualizado com sucesso!' : 'Funcionário adicionado com sucesso!');

            } catch (error) {
                console.error('Erro ao salvar funcionário:', error);
                this.showErrorToast('Erro ao salvar funcionário');
            }
        });
    },

    setupUrlPreviews: function () {
        $('#fotoImagemUrl').on('input', function () {
            const url = $(this).val();
            if (url) {
                $('#fotoImagemPreview').attr('src', url).addClass('show');
            } else {
                $('#fotoImagemPreview').attr('src', '').removeClass('show');
            }
        });

        $('#funcionarioFotoUrl').on('input', function () {
            const url = $(this).val();
            if (url) {
                $('#funcionarioFotoPreview').attr('src', url).addClass('show');
            } else {
                $('#funcionarioFotoPreview').attr('src', '').removeClass('show');
            }
        });
    },

    formatDate: function (dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    },

    formatDateTime: function (dateTimeString) {
        if (!dateTimeString) return '-';
        const date = new Date(dateTimeString);
        return date.toLocaleString('pt-BR');
    }
};

$(document).ready(() => {
    if (window.supabase && window.bootstrap && window.$) {
        document.getElementById('togglePassword').addEventListener('click', function () {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });

        $('#loginForm').on('submit', function (e) {
            e.preventDefault();

            const username = $('#username').val();
            const password = $('#password').val();

            if (username === 'admin' && password === 'admin123') {
                $('#loginModal').hide();
                $('#mainContent').show();
                AdminPanel.init();
            } else {
                $('#loginError').show();
                $('#password').val('').focus();
            }
        });
    } else {
        console.error('Dependências não carregadas:', {
            supabase: !!window.supabase,
            bootstrap: !!window.bootstrap,
            jquery: !!window.$
        });
        alert('Erro ao carregar as dependências. Recarregue a página.');
    }
});