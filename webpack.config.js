const path = require('path');

const CopyPlugin = require("copy-webpack-plugin");
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require("html-webpack-plugin");



module.exports = (env)=>{

    const is_dev = (env.production === undefined);
    const output_path = __dirname;

    const common_srcpath = path.join(__dirname, "web-src", "common");

    const generic_rules = [
        {
            test: /\.vue$/,
            loader: 'vue-loader'
        },
        {
            test: /\.(vue|js)$/,
            loader: 'ifdef-loader',
            exclude: /node_modules/,
            options: {
                DEV: is_dev,
            }
        },
        {
            test: /\.css$/,
            use: [
                'vue-style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        // enable CSS Modules
                        modules: true,
                    }
                }
            ],
        }

    ];

    let ret = [];

    let web_srcpath = path.join(__dirname, "web-src");
    let web_dstpath = path.join(__dirname, is_dev?"web-dev":"web");


    function web_template(scriptname, pagename){ return {
        entry: path.resolve(__dirname, "web-src", scriptname),
        mode: is_dev?'development':'production',
        watch: true,
        output: {
            filename: scriptname,
            path: web_dstpath,
        },
        resolve: {
            alias: {
                app: web_srcpath,
                common: common_srcpath,
                sfc: path.resolve(web_srcpath, "vue"),
            },
            fallback: {
                "fs": false,
                "crypto": false,
            }
        },
        module: {
            rules: generic_rules, 
        },
        plugins: [
            new VueLoaderPlugin(),
            new HtmlWebpackPlugin({
                template: path.join(web_srcpath, pagename),
                filename: path.join(web_dstpath, pagename),
                scriptLoading: "module",
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: path.join(web_srcpath, "static"),
                        to:   path.join(web_dstpath, "static"),
                    }
                ]
            }),
        ]
    } }

    ret.push(web_template("page.index.js", "index.html"));
    ret.push(web_template("page.generate.js", "generate.html"));

    return ret;
};
