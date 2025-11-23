import app from 'flarum/common/app';
import Widget, { WidgetAttrs } from 'flarum/extensions/afrux-forum-widgets-core/common/components/Widget';
import { extName } from '../../r';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Link from 'flarum/common/components/Link';
import icon from 'flarum/common/helpers/icon';
import Discussion from 'flarum/common/models/Discussion';

// 我们不再需要详细定义 Response 接口，因为我们将使用 Flarum 的 Store 模型
interface TrendsWidgetAttrs extends WidgetAttrs {}

export default class TrendsWidget extends Widget<TrendsWidgetAttrs> {
  loading: boolean = true;
  // 将类型改为 Flarum 的 Discussion 模型数组
  trends: Discussion[] = [];

  className(): string {
    return 'liplum-trends-widget';
  }

  icon(): string {
    // 去掉颜色，保持统一风格
    return "fas fa-fire-alt";
  }

  title(): string {
    return app.translator.trans(`${extName}.forum.widget.title`) as string;
  }

  content() {
    if (this.loading) {
      return <LoadingIndicator />;
    }

    if (!this.trends || this.trends.length === 0) {
      return <div className="liplum-trends-empty">{app.translator.trans(`${extName}.forum.widget.empty`)}</div>;
    }

    return (
      <div className="liplum-trends-content">
        <ul className="liplum-trends-list">
          {this.trends.map((disc) => (
            <li className="liplum-trends-item">
              <Link href={app.route.discussion(disc)} className="liplum-trends-link">
                
                {/* 左侧装饰点 */}
                <span className="liplum-trends-bullet"></span>

                {/* 标题 */}
                <span className="liplum-trends-title">
                    {disc.title()}
                </span>

                {/* 右侧统计 */}
                <span className="liplum-trends-stats">
                    {icon('fas fa-comment-alt')} {disc.commentCount()}
                </span>

              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  oncreate(vnode) {
    super.oncreate(vnode);
    this.fetchTrends();
  }

  async fetchTrends() {
    this.loading = true;
    const limit = app.forum.attribute<number | undefined>(`${extName}.limit`);
    
    const params: Record<string, any> = {};
    if (limit) params.limit = limit * 2; // 获取 2 倍数据以防过滤损耗

    // [关键] 请求关联数据
    params.include = 'tags,state,user';

    try {
      const response = await app.request<any>({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/trends/recent',
        params,
      });
      
      // [核心步骤] 将数据推入 Flarum Store
      // 这会将 raw JSON 转换为带有方法的 Discussion Model (支持 .tags(), .lastReadPostNumber() 等)
      app.store.pushPayload(response);

      // 从 Store 中重新获取模型对象
      const models = response.data.map((record: any) => app.store.getById('discussions', record.id)) as Discussion[];

      // [过滤逻辑] 联动 block-tags
      this.trends = models.filter((disc) => {
         if (!disc) return false;
         const tags = disc.tags();
         if (!tags) return true;
         // 只要有一个标签被设为 'hide'，就隐藏该主题
         return !tags.some((tag) => tag.subscription() === 'hide');
      }).slice(0, limit || 5); // 截取最终需要的数量

    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      this.loading = false;
      m.redraw();
    }
  }
}
