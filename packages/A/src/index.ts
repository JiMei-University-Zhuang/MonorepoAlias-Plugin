import { Button } from '@components/Button';
import { helper } from '@utils/helper';

// 测试 @monorepo 引用
import { add, multiply } from '@monorepo/b';

console.log('=== 测试别名导入 ===');
console.log('Button:', Button.name);
helper.sayHello();

console.log('\n=== 测试 @monorepo 导入 ===');
console.log('1 + 2 =', add(1, 2));
console.log('3 x 4 =', multiply(3, 4));