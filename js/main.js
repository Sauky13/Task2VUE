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
        <button type="submit">Добавить</button>
      </form>
      <Column title="0%" :cards="cards0"></Column>
      <Column title="50%" :cards="cards50"></Column>
      <Column title="100%" :cards="cards100"></Column>
    </div>
  `,
  data() {
    return {
      newCardTitle: '',
      cards0: [],
      cards50: [],
      cards100: [],
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

      this.cards0.push({
        id: Date.now(),
        title: this.newCardTitle,
        items: this.newCardItems.map(item => ({ ...item, disabled: this.firstColumnBlocked })),
      });

      this.newCardTitle = '';
      this.newCardItems = Array.from({ length: 3 }, () => ({ text: '', checked: false }));
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
        } else if (progress >= 0.5 && this.cards50.length < this.maxCardsInSecondColumn) {
          this.cards0.splice(index, 1);
          this.cards50.push(card);
        }
      });

      this.cards50.forEach((card, index) => {
        const checkedItems = card.items.filter(item => item.checked).length;
        const progress = checkedItems / card.items.length;

        if (progress === 1) {
          card.completedAt = new Date();
          this.cards50.splice(index, 1);
          this.cards100.push(card);
        }
      });

      this.firstColumnBlocked = this.cards50.length === this.maxCardsInSecondColumn && this.cards0.length > 0;
      this.cards0.forEach(card => {
        card.items.forEach(item => {
          item.disabled = this.firstColumnBlocked;
        });
      });
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
    cards: {
      type: Array,
      default: function () {
        return [];
      }
    }
  },
  template: `
    <div class="column">
      <h2>{{ title }}</h2>
      <div class="cards">
        <Card v-for="card in cards" :key="card.id" :card="card"></Card>
      </div>
    </div>
  `,
  methods: {
    addCard() {
      if (!this.maxCards || this.cards.length < this.maxCards) {
        this.cards.push({ id: Date.now() });
      }
    },
  },
});

Vue.component('Card', {
  props: ['card'],
  template: `
    <div class="card">
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
      <input type="checkbox" v-model="item.checked" :disabled="item.disabled || item.checked" @click.prevent="item.checked || (item.checked = true)">
      <span>{{ item.text }}</span>
    </li>
  `,
});

new Vue({
  el: '#app',
});
