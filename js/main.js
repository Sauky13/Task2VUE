Vue.component('Board', {
  template: `
    <div class="board">
      <form @submit.prevent="addCard">
        <input v-model="newCardTitle" placeholder="Название карточки" required>
        <div v-for="(item, index) in newCardItems" :key="index">
          <input v-model="item.text" placeholder="название пункта">
          <button type="button" @click="removeItem(index)" v-if="newCardItems.length > 3">-</button>
        </div>
        <button type="button" @click="addItem" v-if="newCardItems.length < 5">+</button>
        <button class="button-add" type="submit">Добавить</button>
      </form>
      <Column title="0%" :cards="cards0"></Column>
      <Column title="50%" :cards="cards50"></Column>
      <Column title="100%" :cards="cards100"></Column>
    </div>
  `,
  data() {
    return {
      newCardTitle: '',
      cards0: this.loadCards('cards0'),
      cards50: this.loadCards('cards50'),
      cards100: this.loadCards('cards100'),
      newCardItems: Array.from({ length: 3 }, () => ({ text: '', checked: false })),
      maxCardsInFirstColumn: 3,
      maxCardsInSecondColumn: 5,
      firstColumnBlocked: false,
    };
  },
  methods: {
    addCard() {
      const validItems = this.newCardItems.filter(item => item.text.trim() !== '');
      if (validItems.length < 3) {
        alert('Карточка должна содержать минимум 3 пункта');
        return;
      }

      if (this.cards0.length >= this.maxCardsInFirstColumn) {
        alert('Невозможно добавить больше карточек в первый столбец');
        return;
      }

      if (this.newCardItems.some(item => item.text.trim() === '')) {
        alert('Все пункты должны быть заполнены');
        return;
      }

      this.cards0.push({
        id: Date.now(),
        title: this.newCardTitle,
        items: this.newCardItems.map(item => ({ ...item, disabled: this.firstColumnBlocked })),
      });

      this.saveLocale();

      this.newCardTitle = '';
      this.newCardItems = Array.from({ length: 3 }, () => ({ text: '', checked: false }));
    },
    loadCards(key) {
      const cards = JSON.parse(localStorage.getItem(key)) || [];
      cards.forEach(card => {
        if (card.completedAt) {
          card.completedAt = new Date(card.completedAt);
        }
      });
      return cards;
    },
    addItem() {
      this.newCardItems.push({ text: '' });
    },
    removeItem(index) {
      this.newCardItems.splice(index, 1);
    },
    checkCardProgress() {
      this.cards0.forEach((card, index) => {
        const checkedItems = card.items.filter(item => item.checked).length;
        const progress = checkedItems / card.items.length;

        if (progress === 1) {
          card.completedAt = new Date();
          this.cards0.splice(index, 1);
          this.cards100.push(card);
          this.saveLocale();
        } else if (progress >= 0.5 && this.cards50.length < this.maxCardsInSecondColumn) {
          this.cards0.splice(index, 1);
          this.cards50.push(card);
          this.saveLocale();
        }
      });

      this.cards50.forEach((card, index) => {
        const checkedItems = card.items.filter(item => item.checked).length;
        const progress = checkedItems / card.items.length;

        if (progress === 1) {
          card.completedAt = new Date();
          this.cards50.splice(index, 1);
          this.cards100.push(card);
          this.saveLocale();
        }
      });
      
      this.firstColumnBlocked = this.cards50.length === this.maxCardsInSecondColumn && this.cards0.length > 0;
      if (this.cards50.length === 5) {
        const is50PercentProgress = this.cards0.some(card => {
          const checkedItems = card.items.filter(item => item.checked).length;
          const progress = checkedItems / card.items.length;
          return progress >= 0.5;
        });
    
        this.firstColumnBlocked = is50PercentProgress;
        this.cards0.forEach(card => {
          card.items.forEach(item => {
            item.disabled = this.firstColumnBlocked;
          });
          
        });
        this.cards50.forEach(card => {
          card.items.forEach(item => {
              item.disabled = false;
          });
      });
        
      }
      this.saveLocale();
    },
    saveLocale() {
      localStorage.setItem('cards0', JSON.stringify(this.cards0));
      localStorage.setItem('cards50', JSON.stringify(this.cards50));
      localStorage.setItem('cards100', JSON.stringify(this.cards100));
    },
  },
  watch: {
    cards0: {
      handler() {
        this.checkCardProgress();
      },
      deep: true,
    },
    cards50: {
      handler() {
        this.checkCardProgress();
      },
      deep: true,
    },
  },
});


Vue.component('Column', {
  props: {
    title: String,
    cards: Array
  },
  data() {
    return {
      draggingCard: null
    };
  },
  template: `
  <div class="column" @dragover.prevent @drop="dropCard">
  <h2>{{ title }}</h2>
  <transition-group name="list" tag="div" class="cards">
    <Card v-for="card in cards" :key="card.id" :card="card" @dragstart="dragStart" @dragend="dragEnd"></Card>
  </transition-group>
</div>
  `,
  methods: {
    dragStart(card) {
      this.draggingCard = card;
    },
    dragEnd() {
      this.draggingCard = null;
    },
    dropCard(event) {
      const droppedCardId = event.dataTransfer.getData('text/plain');
      const droppedCardIndex = this.cards.findIndex(card => card.id === parseInt(droppedCardId));
      if (droppedCardIndex > -1) {
        this.cards.splice(droppedCardIndex, 1);
      }
      const position = this.findCardPosition(event.clientY);
      this.cards.splice(position, 0, this.draggingCard);
      this.$emit('update:cards', this.cards);
    },
    findCardPosition(clientY) {
      const cardsElements = this.$el.querySelectorAll('.card');
      const targetElement = Array.from(cardsElements).find(cardElement => cardElement.getBoundingClientRect().top + cardElement.getBoundingClientRect().height / 2 > clientY);
      if (targetElement) {
        return Array.from(cardsElements).indexOf(targetElement);
      } else {
        return this.cards.length;
      }
    },
  },
});


Vue.component('Card', {
  props: ['card'],
  template: `
  <div class="card" :draggable="true" @dragstart="dragStart" @dragend="dragEnd">
  <h3>{{ card.title }}</h3>
  <ul>
    <ListItem v-for="item in card.items" :key="item.id" :item="item"></ListItem>
  </ul>
  <p v-if="card.completedAt">Завершено: {{ formatDate(card.completedAt) }}</p>
</div>
  `,
  data() {
    return {
      items: [],
    };
  },
  methods: {
    dragStart(event) {
      event.dataTransfer.setData('text/plain', this.card.id);
      this.$emit('dragstart', this.card);
    },
    dragEnd() {
      this.$emit('dragend');
    },
    addItem() {
      this.items.push({ id: Date.now(), checked: false });
    },
    formatDate(date) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(2);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${day}.${month}.${year} ${hours}:${minutes}`;
    },
  },
});


Vue.component('ListItem', {
  props: ['item'],
  template: `
    <li>
      <input class="checkbox" type="checkbox" :checked="item.checked" :disabled="item.disabled || item.checked" @change="item.checked = $event.target.checked" >
      <span>{{ item.text }}</span>
    </li>
  `,
});

new Vue({
  el: '#app',
});
