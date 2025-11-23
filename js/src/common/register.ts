import Application from 'flarum/common/Application';
import Widgets from 'flarum/extensions/afrux-forum-widgets-core/common/extend/Widgets';
import TrendsWidget from './components/widget';
import { extName } from '../r';

export default function (app: Application) {
  // [权限控制]
  // 如果当前用户（或游客）没有浏览论坛的权限，直接中止，不注册挂件。
  if (app.forum && !app.forum.attribute('canViewForum')) {
    return;
  }

  new Widgets()
    .add({
      key: 'liplum-trends-widget',
      component: TrendsWidget,
      isDisabled: false,
      isUnique: true,
      placement: 'top',
      position: 1,
    })
    .extend(app, extName);
}
