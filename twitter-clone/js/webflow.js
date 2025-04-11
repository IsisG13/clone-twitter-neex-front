// Script para página de publicações
document.addEventListener("DOMContentLoaded", function () {
  // Verificar se o usuário está logado
  const token = localStorage.getItem("auth_token");
  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name");
  const currentPage = window.location.pathname;

  // Apenas redirecionar se estiver na página de publicações e não estiver logado
  if (!token && currentPage.includes("publicacoes.html")) {
    // Se não estiver logado, redirecionar para a página de login
    window.location.href = "index.html";
    return;
  }

  // Exibir nome do usuário logado
  const nomePerfil = document.querySelector(".nome-perfil");
  if (nomePerfil) {
    nomePerfil.textContent = userName || "Usuário";
  }

  // Carregar feed de tweets
  carregarFeed();

  // Formulário para publicar novo tweet
  const formPublicar = document.getElementById("form-publicar");
  if (formPublicar) {
    formPublicar.addEventListener("submit", function (event) {
      event.preventDefault();

      const textoPublicacao = document.getElementById("texto-publicacao").value;

      if (!textoPublicacao.trim()) {
        alert("Por favor, escreva algo para publicar.");
        return;
      }

      publicarTweet(textoPublicacao);
    });
  }

  // Botão para fazer logout
  const botaoLogout = document.getElementById("botao-logout");
  if (botaoLogout) {
    botaoLogout.addEventListener("click", function (event) {
      event.preventDefault();

      fetch("http://localhost:8000/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          // Limpar dados do localStorage
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("user_name");

          // Redirecionar para a página de login
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("Erro ao fazer logout:", error);
          // Em caso de erro, ainda assim limpa o localStorage e redireciona
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("user_name");
          window.location.href = "index.html";
        });
    });
  }

  // Função para carregar o feed de tweets
  function carregarFeed() {
    fetch("http://localhost:8000/api/tweets", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao carregar feed");
        }
        return response.json();
      })
      .then((data) => {
        // A resposta tem os tweets dentro da propriedade 'tweets'
        const tweets = data.tweets || [];

        if (tweets.length === 0) {
          // Mostrar mensagem se não houver tweets
          const containerFeed = document.getElementById("container-feed");
          if (containerFeed) {
            containerFeed.innerHTML =
              '<p class="sem-tweets">Não há publicações para exibir.</p>';
          }
        } else {
          // Exibir os tweets
          exibirTweets(tweets);
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Não foi possível carregar o feed. Tente novamente mais tarde.");
      });
  }

  // Função para publicar um novo tweet
  function publicarTweet(conteudo) {
    const mensagemSucesso = document.getElementById("mensagem-sucesso");
    const mensagemErro = document.getElementById("mensagem-erro");

    // Esconde as mensagens
    mensagemSucesso.style.display = "none";
    mensagemErro.style.display = "none";

    fetch("http://localhost:8000/api/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: conteudo,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao publicar: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        // Limpar campo de texto
        document.getElementById("texto-publicacao").value = "";

        // Mostrar mensagem de sucesso
        mensagemSucesso.style.display = "block";
        setTimeout(() => {
          mensagemSucesso.style.display = "none";
        }, 3000);

        // Recarregar feed para mostrar o novo tweet
        carregarFeed();
      })
      .catch((error) => {
        console.error("Erro:", error);
        // Mostrar mensagem de erro
        mensagemErro.style.display = "block";
        setTimeout(() => {
          mensagemErro.style.display = "none";
        }, 3000);
      });
  }

  // Função para exibir os tweets no feed
  function exibirTweets(tweets) {
    const containerFeed = document.getElementById("container-feed");
    if (!containerFeed) return;

    // Limpar conteúdo atual
    containerFeed.innerHTML = "";

    // Criar elemento para cada tweet
    tweets.forEach((tweet) => {
      const divTweet = document.createElement("div");
      divTweet.className = "div-publicacao-feed";
      divTweet.setAttribute("data-user-id", tweet.user.id);

      // Nome do autor
      const nomeAutor = document.createElement("p");
      nomeAutor.className = "nome-autor";
      nomeAutor.textContent = tweet.user.name;

      // Conteúdo do tweet
      const textoTweet = document.createElement("p");
      textoTweet.className = "texto-publicacao";
      textoTweet.textContent = tweet.content;

      // Adicionar evento de clique ao tweet para mostrar o perfil do usuário
      divTweet.addEventListener("click", function(event) {
        // Prevenir a propagação do clique para não interferir com os comentários
        if (event.target === divTweet || 
            event.target === nomeAutor || 
            event.target === textoTweet) {
          carregarPerfilUsuario(tweet.user.id);
        }
      });

      // Container para comentários
      const divComentarios = document.createElement("div");
      divComentarios.className = "div-comentario-existente";

      // Adicionar elementos ao tweet
      divTweet.appendChild(nomeAutor);
      divTweet.appendChild(textoTweet);

      // Carregar e exibir comentários (se necessário)
      if (tweet.comments && tweet.comments.length > 0) {
        exibirComentarios(tweet.comments, divComentarios);
      }

      // Formulário para adicionar comentário
      const formComentario = document.createElement("div");
      formComentario.className = "w-form";
      formComentario.innerHTML = `
        <form id="form-comentario-${tweet.id}" class="w-clearfix">
          <textarea placeholder="..." maxlength="5000" id="texto-comentario-${tweet.id}" class="textarea w-input"></textarea>
          <input type="submit" value="Comentar" data-wait="Aguarde..." class="submit-button w-button">
        </form>
      `;

      // Adicionar event listener para o formulário de comentário
      formComentario
        .querySelector(`#form-comentario-${tweet.id}`)
        .addEventListener("submit", function (event) {
          event.preventDefault();

          const textoComentario = document.getElementById(
            `texto-comentario-${tweet.id}`
          ).value;

          if (!textoComentario.trim()) {
            alert("Por favor, escreva algo para comentar.");
            return;
          }

          comentarTweet(tweet.id, textoComentario, divComentarios);
        });

      divComentarios.appendChild(formComentario);
      divTweet.appendChild(divComentarios);

      // Adicionar tweet ao container
      containerFeed.appendChild(divTweet);
    });
  }

  // Função para carregar o perfil de um usuário
  function carregarPerfilUsuario(usuarioId) {
    // Carregar os dados do usuário
    fetch(`http://localhost:8000/api/users/${usuarioId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao carregar perfil do usuário: " + response.status);
        }
        return response.json();
      })
      .then((usuario) => {
        atualizarPerfilSelecionado(usuario);
        
        // Carregar contagem de seguidores
        carregarSeguidores(usuarioId);
        
        // Carregar contagem de seguindo
        carregarSeguindo(usuarioId);
        
        // Verificar se o usuário atual já segue este usuário
        verificarSeguimento(usuarioId);
      })
      .catch((error) => {
        console.error("Erro ao carregar perfil do usuário:", error);
      });
  }

  // Função para atualizar o perfil selecionado na interface
  function atualizarPerfilSelecionado(usuario) {
    const perfilSelecionado = document.getElementById("perfil-selecionado");
    const perfilNome = document.getElementById("perfil-selecionado-nome");
    const botaoSeguirUsuario = document.getElementById("botao-seguir-usuario");

    if (perfilSelecionado && perfilNome && botaoSeguirUsuario) {
      // Atualiza as informações do perfil selecionado
      perfilNome.textContent = usuario.name;
      botaoSeguirUsuario.setAttribute("data-user-id", usuario.id);
      
      // Mostra a seção do perfil selecionado
      perfilSelecionado.style.display = "block";
    }
  }

  // Função para carregar a contagem de seguidores
  function carregarSeguidores(usuarioId) {
    fetch(`http://localhost:8000/api/users/${usuarioId}/followers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao carregar seguidores: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        // Atualizar o contador de seguidores na interface
        const seguidoresCount = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
        const seguidoresElement = document.getElementById("seguidores-count");
        if (seguidoresElement) {
          seguidoresElement.textContent = seguidoresCount;
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar seguidores:", error);
      });
  }

  // Função para carregar a contagem de seguindo
  function carregarSeguindo(usuarioId) {
    fetch(`http://localhost:8000/api/users/${usuarioId}/following`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao carregar seguindo: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        // Atualizar o contador de seguindo na interface
        const seguindoCount = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
        const seguindoElement = document.getElementById("seguindo-count");
        if (seguindoElement) {
          seguindoElement.textContent = seguindoCount;
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar seguindo:", error);
      });
  }

  // Função para verificar se o usuário atual já segue outro usuário
  function verificarSeguimento(usuarioId) {
    fetch(`http://localhost:8000/api/users/${userId}/following`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao verificar seguimento: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        // Verificar estrutura dos dados
        const seguindo = Array.isArray(data) ? data : data.data || [];

        // Verificar se o perfil atual está na lista de seguidos
        const jaSeguindo = seguindo.some(
          (follow) => follow.id == usuarioId
        );

        // Atualizar texto do botão
        const botaoSeguirUsuario = document.getElementById("botao-seguir-usuario");
        if (botaoSeguirUsuario) {
          botaoSeguirUsuario.querySelector(".seguir").textContent = jaSeguindo
            ? "deixar de seguir"
            : "seguir";
        }
      })
      .catch((error) => {
        console.error("Erro ao verificar seguimento:", error);
      });
  }

  // Evento para o botão seguir/deixar de seguir do perfil selecionado
  const botaoSeguirUsuario = document.getElementById("botao-seguir-usuario");
  if (botaoSeguirUsuario) {
    botaoSeguirUsuario.addEventListener("click", function(event) {
      event.preventDefault();
      
      const usuarioId = this.getAttribute("data-user-id");
      if (!usuarioId) {
        alert("Usuário não identificado");
        return;
      }

      const estaSeguindo = this.querySelector(".seguir").textContent === "deixar de seguir";
      
      if (estaSeguindo) {
        deixarDeSeguirUsuario(usuarioId);
      } else {
        seguirUsuario(usuarioId);
      }
    });
  }

  // Função para seguir um usuário
  function seguirUsuario(usuarioId) {
    fetch(`http://localhost:8000/api/users/${usuarioId}/follow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao seguir usuário: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        // Atualiza o estado do botão
        verificarSeguimento(usuarioId);
        
        // Recarrega as contagens de seguidores
        carregarSeguidores(usuarioId);
        
        // Recarrega o feed para possíveis atualizações
        carregarFeed();
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert(
          "Não foi possível seguir este usuário. Tente novamente mais tarde."
        );
      });
  }

  // Função para deixar de seguir um usuário
  function deixarDeSeguirUsuario(usuarioId) {
    fetch(`http://localhost:8000/api/users/${usuarioId}/unfollow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao deixar de seguir usuário: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        // Atualiza o estado do botão
        verificarSeguimento(usuarioId);
        
        // Recarrega as contagens de seguidores
        carregarSeguidores(usuarioId);
        
        // Recarrega o feed para possíveis atualizações
        carregarFeed();
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert(
          "Não foi possível deixar de seguir este usuário. Tente novamente mais tarde."
        );
      });
  }

  // Função para carregar comentários de um tweet
  function carregarComentarios(tweetId, container) {
    fetch(`http://localhost:8000/api/tweets/${tweetId}/comments`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao carregar comentários");
        }
        return response.json();
      })
      .then((data) => {
        exibirComentarios(data, container);
      })
      .catch((error) => {
        console.error("Erro ao carregar comentários:", error);
      });
  }

  // Função para exibir comentários de um tweet
  function exibirComentarios(comentarios, container) {
    // Remover formulário temporariamente
    const formComentario = container.querySelector(".w-form");
    if (formComentario) {
      container.removeChild(formComentario);
    }

    // Limpar outros comentários existentes
    const elementosAnteriores = Array.from(container.children);
    elementosAnteriores.forEach((elemento) => {
      if (!elemento.classList.contains("w-form")) {
        container.removeChild(elemento);
      }
    });

    // Exibir cada comentário
    comentarios.forEach((comentario) => {
      const divComentario = document.createElement("div");
      divComentario.className = "comentario-item";

      const nomeComentario = document.createElement("p");
      nomeComentario.className = "nome-perfil-comentario";
      nomeComentario.textContent = comentario.user?.name || "Usuário";

      const textoComentario = document.createElement("p");
      textoComentario.className = "comentario";
      textoComentario.textContent = comentario.content || comentario.text || comentario.body || "Sem conteúdo";

      divComentario.appendChild(nomeComentario);
      divComentario.appendChild(textoComentario);

      container.appendChild(divComentario);
    });

    // Adicionar formulário novamente
    if (formComentario) {
      container.appendChild(formComentario);
    }
  }

  // Função para comentar em um tweet
  function comentarTweet(tweetId, conteudo, container) {
    fetch(`http://localhost:8000/api/tweets/${tweetId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: conteudo,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao comentar");
        }
        return response.json();
      })
      .then((data) => {
        // Limpar campo de texto
        document.getElementById(`texto-comentario-${tweetId}`).value = "";

        // Recarregar comentários
        carregarComentarios(tweetId, container);
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert(
          "Não foi possível adicionar o comentário. Tente novamente mais tarde."
        );
      });
  }
});