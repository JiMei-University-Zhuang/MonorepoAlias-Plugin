const path = require('path');
const fs = require('fs');

class MonorepoAliasPlugin {
  constructor(options = {}) {
    if (!options.root) {
      throw new Error('必须提供 root 配置项，用于指定 monorepo 的根目录');
    }
    this.options = {
      root: options.root
    };
  }

  // 获取所有 workspace 包的路径
  getWorkspacePackages() {
    try {
      const pnpmWorkspacePath = path.join(this.options.root, 'pnpm-workspace.yaml');
      if (!fs.existsSync(pnpmWorkspacePath)) {
        throw new Error('未找到 pnpm-workspace.yaml 文件');
      }

      const workspaceContent = fs.readFileSync(pnpmWorkspacePath, 'utf-8');
      const packages = workspaceContent.match(/packages:[\s\S]*?- (.+)/g)
        ?.map(line => line.replace(/packages:|\s*-\s*/g, '').trim())
        .filter(Boolean) || [];

      return packages.map(pkg => {
        if (pkg.includes('/*')) {
          const basePath = pkg.replace('/*', '');
          const fullPath = path.join(this.options.root, basePath);
          return fs.readdirSync(fullPath)
            .map(dir => path.join(fullPath, dir))
            .filter(dir => fs.statSync(dir).isDirectory());
        }
        return [path.join(this.options.root, pkg)];
      }).flat();
    } catch (error) {
      console.error('读取 workspace 包失败:', error);
      return [];
    }
  }

  parseTsConfig(packagePath) {
    try {
      const tsconfigPath = path.join(packagePath, 'tsconfig.json');
      
      if (!fs.existsSync(tsconfigPath)) {
        return {};
      }

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      const paths = tsconfig.compilerOptions?.paths;
      const baseUrl = tsconfig.compilerOptions?.baseUrl || '.';

      if (!paths) {
        return {};
      }

      const aliases = {};
      Object.entries(paths).forEach(([aliasKey, pathArray]) => {
        if (!pathArray || !pathArray.length) return;

        const relativePath = pathArray[0];
        if (!relativePath || typeof relativePath !== 'string') return;

        try {
          const cleanAlias = aliasKey.replace('/*', '');
          const cleanPath = relativePath.replace('/*', '');
          
          aliases[cleanAlias] = path.resolve(
            packagePath,
            baseUrl,
            cleanPath
          );
        } catch (error) {
          console.error(`处理别名 ${aliasKey} 的路径时出错:`, error);
        }
      });

      return aliases;
    } catch (error) {
      console.error(`解析 ${packagePath} 的 tsconfig.json 失败:`, error);
      return {};
    }
  }

  mergeAliasIntoWebpackConfig(compiler, aliases) {
    compiler.options.resolve = {
      ...compiler.options.resolve,
      alias: {
        ...compiler.options.resolve?.alias,
        ...aliases
      }
    };
  }

  apply(compiler) {
    // 处理所有包的 tsconfig 别名
    compiler.hooks.initialize.tap('MonorepoAliasPlugin', () => {
      try {
        // 获取所有 workspace 包
        const packages = this.getWorkspacePackages();
        const workspaceAliases = {};

        // 处理每个包的 tsconfig.json
        packages.forEach(packagePath => {
          const aliases = this.parseTsConfig(packagePath);
          Object.assign(workspaceAliases, aliases);
        });

        // 合并所有别名配置
        this.mergeAliasIntoWebpackConfig(compiler, workspaceAliases);
        console.log('已注入所有包的别名配置');
      } catch (error) {
        console.error('MonorepoAliasPlugin 处理失败:', error);
      }
    });

    // 处理 @monorepo 前缀的模块解析
    compiler.hooks.normalModuleFactory.tap('MonorepoAliasPlugin', (normalModuleFactory) => {
      normalModuleFactory.hooks.beforeResolve.tap('MonorepoAliasPlugin', (resolveData) => {
        if (!resolveData) return true;
        
        if (resolveData.request.startsWith('@monorepo/')) {
          const packageName = resolveData.request;
          const packagePath = path.resolve(
            this.options.root, 
            'packages', 
            packageName.replace('@monorepo/', '')
          );
          
          if (fs.existsSync(packagePath)) {
            const packageJson = require(path.join(packagePath, 'package.json'));
            resolveData.request = path.resolve(
              packagePath, 
              packageJson.main || 'src/index'
            );
          }
        }
        
        return true;
      });
    });
  }
}

module.exports = MonorepoAliasPlugin;
