import { createApp, defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { setupGlobDirectives } from '@/directives'
import language from '@/locales'
import { store } from '@/store'
import InsuranceCompanyDialog from '@vms/views/basic-info/insurance-company/modules/insurance-company-dialog.vue'
import '@styles/core/tailwind.css'
import '@styles/index.scss'

const Preview = defineComponent({
  setup() {
    const dialog = ref<{ handleOpen: () => Promise<void> }>()
    return () =>
      h('main', { style: 'padding: 24px' }, [
        h(
          'button',
          {
            type: 'button',
            onClick: () => dialog.value?.handleOpen()
          },
          '打开保险公司弹窗'
        ),
        h(InsuranceCompanyDialog, { ref: dialog })
      ])
  }
})

const app = createApp(Preview)
app.use(store)
app.use(
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }]
  })
)
app.use(language)
setupGlobDirectives(app)
app.mount('#insurance-company-feedback-preview')
